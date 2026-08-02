import asyncio
import json
import logging
import sys
import uuid
import random
import time

# Configuração simples de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

try:
    import websockets
except ImportError:
    logging.error("A biblioteca 'websockets' não está instalada.")
    logging.info("Por favor, execute: pip install websockets")
    sys.exit(1)

# Conexões ativas
connected_clients = set()  # Todos os clientes conectados
admin_clients = set()      # Dashboard do Administrador

# Dicionário de dispositivos emparelhados e pendentes
# token -> { "pin": "1234", "role": None, "tatami": None, "websocket": ws, "latency": 0, "last_ping_sent": None, "connected": True }
devices = {}
# pin -> token
pin_to_token = {}

# Estados de luta por Tatame (Coto)
# "Tatame 1" -> state_dict
tatami_states = {}

def generate_pin():
    while True:
        pin = f"{random.randint(1000, 9999)}"
        if pin not in pin_to_token:
            return pin

async def broadcast_devices_to_admins():
    """Envia a lista de conexões ativas e latências para todos os administradores conectados."""
    if not admin_clients:
        return
    
    devices_list = []
    for token, dev in devices.items():
        devices_list.append({
            "pin": dev["pin"],
            "role": dev["role"],
            "tatami": dev["tatami"],
            "latency": dev["latency"],
            "connected": dev.get("websocket") is not None and dev["websocket"].open
        })
        
    msg = json.dumps({
        "type": "devices_list",
        "devices": devices_list
    })
    
    await asyncio.gather(
        *[admin.send(msg) for admin in admin_clients if admin.open],
        return_exceptions=True
    )

async def ping_loop():
    """Loop periódico para medir latência (ping) de todos os dispositivos ativos."""
    while True:
        await asyncio.sleep(4)
        now = time.time()
        need_update = False
        
        for token, dev in list(devices.items()):
            ws = dev.get("websocket")
            if ws and ws.open:
                dev["last_ping_sent"] = now
                try:
                    await ws.send(json.dumps({
                        "type": "ping_request",
                        "timestamp": now
                    }))
                except Exception:
                    dev["connected"] = False
                    dev["websocket"] = None
                    need_update = True
            elif ws and not ws.open:
                dev["connected"] = False
                dev["websocket"] = None
                need_update = True
                
        if need_update:
            await broadcast_devices_to_admins()

async def register(websocket):
    connected_clients.add(websocket)
    logging.info(f"Novo cliente conectado. Total: {len(connected_clients)}")

async def unregister(websocket):
    connected_clients.remove(websocket)
    if websocket in admin_clients:
        admin_clients.remove(websocket)
        
    # Marca dispositivo correspondente como desconectado, mas retém a sessão
    need_update = False
    for token, dev in list(devices.items()):
        if dev.get("websocket") == websocket:
            dev["websocket"] = None
            dev["connected"] = False
            logging.info(f"Dispositivo PIN {dev['pin']} desconectado (Sessão retida).")
            need_update = True
            break
            
    logging.info(f"Cliente desconectado. Total: {len(connected_clients)}")
    if need_update:
        await broadcast_devices_to_admins()

async def handler(websocket):
    await register(websocket)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type")
                
                # --- FLUXO DE PAREAMENTO ---
                
                # Dispositivo novo solicita código de pareamento
                if msg_type == "get_pairing_code":
                    token = str(uuid.uuid4())
                    pin = generate_pin()
                    
                    devices[token] = {
                        "pin": pin,
                        "role": None,
                        "tatami": None,
                        "websocket": websocket,
                        "latency": 0,
                        "last_ping_sent": None,
                        "connected": True
                    }
                    pin_to_token[pin] = token
                    
                    await websocket.send(json.dumps({
                        "type": "pairing_code",
                        "code": pin,
                        "token": token
                    }))
                    await broadcast_devices_to_admins()
                    
                # Dispositivo tenta reconectar usando um token existente
                elif msg_type == "client_reconnect":
                    token = data.get("token")
                    if token in devices:
                        # Associa a nova conexão ao dispositivo existente
                        devices[token]["websocket"] = websocket
                        devices[token]["connected"] = True
                        
                        logging.info(f"Dispositivo PIN {devices[token]['pin']} reconectado com sucesso.")
                        
                        # Responde informando o pareamento/papel atual
                        role = devices[token]["role"]
                        tatami = devices[token]["tatami"]
                        
                        await websocket.send(json.dumps({
                            "type": "routing",
                            "view": role if role else "pairing",
                            "tatami": tatami
                        }))
                        await broadcast_devices_to_admins()
                    else:
                        # Token inválido ou expirado, força a gerar um novo PIN
                        new_token = str(uuid.uuid4())
                        pin = generate_pin()
                        devices[new_token] = {
                            "pin": pin,
                            "role": None,
                            "tatami": None,
                            "websocket": websocket,
                            "latency": 0,
                            "last_ping_sent": None,
                            "connected": True
                        }
                        pin_to_token[pin] = new_token
                        
                        await websocket.send(json.dumps({
                            "type": "pairing_code",
                            "code": pin,
                            "token": new_token
                        }))
                        await broadcast_devices_to_admins()
                
                # Registro do Dashboard Admin
                elif msg_type == "admin_register":
                    admin_clients.add(websocket)
                    logging.info("Dashboard Admin registrado para eventos LAN.")
                    await broadcast_devices_to_admins()
                    
                # Admin atribui papel e tatame a um PIN
                elif msg_type == "assign_device":
                    pin = data.get("pin")
                    role = data.get("role")      # 'operator', 'display', 'marshall' (ou None para liberar)
                    tatami = data.get("tatami")  # 'Tatame 1', etc. (ou None)
                    
                    token = pin_to_token.get(pin)
                    if token in devices:
                        # 1. Se estiver atribuindo um papel ativo, libera forçadamente o dispositivo anterior com o mesmo papel/tatame
                        if role and tatami:
                            for t_old, dev_old in list(devices.items()):
                                if t_old != token and dev_old.get("role") == role and dev_old.get("tatami") == tatami:
                                    dev_old["role"] = None
                                    dev_old["tatami"] = None
                                    old_ws = dev_old.get("websocket")
                                    if old_ws and old_ws.open:
                                        try:
                                            await old_ws.send(json.dumps({
                                                "type": "routing",
                                                "view": "pairing",
                                                "tatami": None
                                            }))
                                        except Exception:
                                            pass
                                    logging.info(f"Dispositivo anterior PIN {dev_old['pin']} liberado forçadamente por reatribuição.")
                        
                        devices[token]["role"] = role
                        devices[token]["tatami"] = tatami
                        
                        # Notifica o cliente para redirecionar reativamente
                        client_ws = devices[token]["websocket"]
                        if client_ws and client_ws.open:
                            await client_ws.send(json.dumps({
                                "type": "routing",
                                "view": role if role else "pairing",
                                "tatami": tatami
                            }))
                            
                        logging.info(f"Dispositivo PIN {pin} alocado ao [{tatami}] como [{role}].")
                        await broadcast_devices_to_admins()
                
                # Cliente solicita substituição (Relief Request)
                elif msg_type == "request_relief":
                    sender_pin = None
                    sender_role = None
                    sender_tatami = None
                    for token, dev in devices.items():
                        if dev.get("websocket") == websocket:
                            sender_pin = dev.get("pin")
                            sender_role = dev.get("role")
                            sender_tatami = dev.get("tatami")
                            break
                            
                    if sender_pin and sender_role:
                        logging.info(f"Dispositivo PIN {sender_pin} solicitou substituição no [{sender_tatami}] como [{sender_role}].")
                        # Propaga para todos os administradores conectados
                        relief_msg = json.dumps({
                            "type": "relief_requested",
                            "pin": sender_pin,
                            "role": sender_role,
                            "tatami": sender_tatami
                        })
                        for admin in admin_clients:
                            if admin.open:
                                try:
                                    await admin.send(relief_msg)
                                except Exception:
                                    pass
                
                # Resposta de ping para medir latência
                elif msg_type == "pong_response":
                    timestamp = data.get("timestamp")
                    if timestamp:
                        latency = (time.time() - float(timestamp)) * 1000
                        for token, dev in devices.items():
                            if dev.get("websocket") == websocket:
                                dev["latency"] = round(latency, 1)
                                break
                        await broadcast_devices_to_admins()
                
                # --- FLUXO DE COMBATE (Placar) ---
                
                elif msg_type == "update_scoreboard":
                    new_state = data.get("state", {})
                    
                    # Identifica qual é o tatame do remetente
                    tatami_name = None
                    for token, dev in devices.items():
                        if dev.get("websocket") == websocket:
                            tatami_name = dev.get("tatami")
                            break
                            
                    if not tatami_name:
                        tatami_name = data.get("tatami") or "Geral"
                        
                    if tatami_name not in tatami_states:
                        tatami_states[tatami_name] = {
                            "match_id": None,
                            "category_name": "Carregando...",
                            "athlete_red": "Aka",
                            "athlete_blue": "Ao",
                            "score_red": 0,
                            "score_blue": 0,
                            "senshu": None,
                            "penalties_red": 0,
                            "penalties_blue": 0,
                            "timer_seconds": 180,
                            "timer_active": False,
                            "is_finished": False
                        }
                        
                    tatami_states[tatami_name].update(new_state)
                    
                    # Envia a sincronização APENAS para mesários/displays do mesmo tatame
                    state_msg = json.dumps({
                        "type": "state_sync",
                        "state": tatami_states[tatami_name]
                    })
                    
                    for token, dev in devices.items():
                        if dev.get("tatami") == tatami_name and dev.get("websocket") and dev.get("role") in ["display", "operator"]:
                            try:
                                await dev["websocket"].send(state_msg)
                            except Exception:
                                pass
                                
                elif msg_type in ["audio_signal", "point_scored"]:
                    # Retransmite eventos pontuais para o mesmo tatame
                    tatami_name = None
                    for token, dev in devices.items():
                        if dev.get("websocket") == websocket:
                            tatami_name = dev.get("tatami")
                            break
                            
                    if tatami_name:
                        for token, dev in devices.items():
                            if dev.get("tatami") == tatami_name and dev.get("websocket") and dev.get("websocket") != websocket:
                                try:
                                    await dev["websocket"].send(message)
                                except Exception:
                                    pass
                                    
            except json.JSONDecodeError:
                pass
            except Exception as e:
                logging.error(f"Erro ao processar mensagem: {e}")
                
    except websockets.exceptions.ConnectionClosedOK:
        pass
    except websockets.exceptions.ConnectionClosedError as e:
        logging.warning(f"Conexão encerrada com erro: {e}")
    finally:
        await unregister(websocket)

async def main():
    port = 8080
    host = "0.0.0.0"
    logging.info(f"Iniciando Servidor WebSocket local de Karatê na porta {port}...")
    
    # Inicia a thread/task de ping em background
    asyncio.create_task(ping_loop())
    
    async with websockets.serve(handler, host, port):
        logging.info(f"Servidor rodando e escutando conexões LAN em ws://[SEU_IP_LAN]:{port}")
        await asyncio.Future()  # roda para sempre

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Servidor WebSocket encerrado pelo usuário.")
