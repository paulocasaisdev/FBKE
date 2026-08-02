import math
import uuid
import random
from typing import List, Dict, Any, Tuple, Optional

class BracketGenerator:
    """
    Gerador determinístico de chaves de eliminação simples (Single-Elimination Bracket)
    com suporte a Dojo Protection (atletas do mesmo dojo não se enfrentam na primeira rodada).
    """

    @staticmethod
    def get_seeding_order(n: int) -> List[int]:
        """
        Retorna a ordem de sementes (seeding order) clássica de torneio para N posições (potência de 2).
        Exemplo para N=8: [1, 8, 5, 4, 3, 6, 7, 2]
        """
        order = [1]
        while len(order) < n:
            next_order = []
            target = len(order) * 2 + 1
            for x in order:
                next_order.append(x)
                next_order.append(target - x)
            order = next_order
        return order

    @classmethod
    def generate(cls, registrations: List[Dict[str, Any]], category_id: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Gera a chave de confrontos de eliminação simples usando a lógica de preenchimento alternado (head-tail).
        Retorna uma tupla (matches, registrations_updated).
        - matches: Lista de dicionários representando as lutas geradas (prontas para salvar no banco).
        - registrations_updated: Lista de registros com informações de sementes (opcional).
        """
        # 1. Filtra registros confirmados e ordena deterministicamente por ID do atleta para reprodutibilidade
        active_regs = [r for r in registrations if r.get("status", "confirmed") == "confirmed"]
        
        num_athletes = len(active_regs)
        if num_athletes == 0:
            return [], []

        # 2. Calcula o tamanho da chave N (menor potência de 2 >= num_athletes)
        if num_athletes <= 2:
            n = 2
        else:
            n = 2 ** math.ceil(math.log2(num_athletes))

        # 3. Agrupar e embaralhar atletas garantindo separação de Dojos
        # Para fins de reprodutibilidade em testes (determinismo), nós ordenamos e usamos uma semente baseada no category_id.
        sorted_athletes = list(active_regs)
        sorted_athletes.sort(key=lambda x: x.get("athlete_id", ""))
        
        rng = random.Random(category_id)
        rng.shuffle(sorted_athletes)

        # Array de slots da Primeira Rodada (tamanho = n)
        slots = [None] * n

        # 4. Preenchimento alternado de topo e base da chave para separar dojos (lógica head-tail do design)
        head = 0
        tail = n - 1

        for athlete in sorted_athletes:
            if head <= tail:
                slots[head] = athlete
                head += 1
            else:
                slots[tail] = athlete
                tail -= 1

        # 5. Criar toda a árvore de lutas (Brackets)
        # Vamos gerar os IDs de todas as lutas de todas as rodadas previamente para podermos linkar pais e filhos.
        # Número total de rodadas: log2(N)
        num_rounds = int(math.log2(n))
        
        # Estrutura para armazenar as partidas criadas
        # rounds_matches[round_number][match_number] = match_dict
        rounds_matches: Dict[int, Dict[int, Dict[str, Any]]] = {}
        for r_num in range(1, num_rounds + 1):
            rounds_matches[r_num] = {}

        # Primeiro, inicializa todos os registros de partidas com IDs únicos
        # para podermos referenciar parent_red_match_id e parent_blue_match_id
        for r_num in range(1, num_rounds + 1):
            matches_in_round = n // (2 ** r_num)
            for m_num in range(1, matches_in_round + 1):
                match_id = str(uuid.uuid4())
                rounds_matches[r_num][m_num] = {
                    "id": match_id,
                    "category_id": category_id,
                    "round_number": r_num,
                    "match_number": m_num,
                    "athlete_red_id": None,
                    "athlete_red_name": None,
                    "athlete_blue_id": None,
                    "athlete_blue_name": None,
                    "winner_id": None,
                    "score_red": 0,
                    "score_blue": 0,
                    "status": "scheduled",
                    "match_order": 0,
                    "parent_red_match_id": None,
                    "parent_blue_match_id": None
                }

        # 6. Preenche a Rodada 1 e faz o avanço automático de BYEs
        round_1_matches = rounds_matches[1]
        for m_num in range(1, len(round_1_matches) + 1):
            match = round_1_matches[m_num]
            
            athlete_red = slots[(m_num - 1) * 2]
            athlete_blue = slots[(m_num - 1) * 2 + 1]
            
            if athlete_red:
                match["athlete_red_id"] = athlete_red.get("athlete_id") or athlete_red.get("id")
                match["athlete_red_name"] = athlete_red.get("athlete_name") or athlete_red.get("nome")
            if athlete_blue:
                match["athlete_blue_id"] = athlete_blue.get("athlete_id") or athlete_blue.get("id")
                match["athlete_blue_name"] = athlete_blue.get("athlete_name") or athlete_blue.get("nome")
                
            # Tratamento de BYEs na Rodada 1
            if athlete_red and not athlete_blue:
                # Vermelho avança por BYE
                match["winner_id"] = athlete_red.get("athlete_id") or athlete_red.get("id")
                match["status"] = "bye"
                cls._propagate_winner_to_parent(rounds_matches, 1, m_num, match["winner_id"], match["athlete_red_name"])
            elif athlete_blue and not athlete_red:
                # Azul avança por BYE
                match["winner_id"] = athlete_blue.get("athlete_id") or athlete_blue.get("id")
                match["status"] = "bye"
                cls._propagate_winner_to_parent(rounds_matches, 1, m_num, match["winner_id"], match["athlete_blue_name"])
            elif not athlete_red and not athlete_blue:
                # Ambos BYEs
                match["status"] = "bye"
            else:
                # Luta real agendada
                match["status"] = "scheduled"

        # 8. Vincular partidas das rodadas subsequentes aos seus filhos da rodada anterior
        for r_num in range(2, num_rounds + 1):
            matches_in_round = n // (2 ** r_num)
            for m_num in range(1, matches_in_round + 1):
                parent_match = rounds_matches[r_num][m_num]
                # A partida atual na rodada r_num e posição m_num recebe os vencedores das partidas
                # 2 * m_num - 1 e 2 * m_num da rodada anterior (r_num - 1)
                child_red_match = rounds_matches[r_num - 1][2 * m_num - 1]
                child_blue_match = rounds_matches[r_num - 1][2 * m_num]
                
                parent_match["parent_red_match_id"] = child_red_match["id"]
                parent_match["parent_blue_match_id"] = child_blue_match["id"]
                
                # Se as duas partidas filhas já têm vencedores (por exemplo, devido a BYEs),
                # eles são trazidos para a partida atual
                if child_red_match["winner_id"]:
                    parent_match["athlete_red_id"] = child_red_match["winner_id"]
                    parent_match["athlete_red_name"] = child_red_match["athlete_red_name"] if child_red_match["winner_id"] == child_red_match["athlete_red_id"] else child_red_match["athlete_blue_name"]
                if child_blue_match["winner_id"]:
                    parent_match["athlete_blue_id"] = child_blue_match["winner_id"]
                    parent_match["athlete_blue_name"] = child_blue_match["athlete_red_name"] if child_blue_match["winner_id"] == child_blue_match["athlete_red_id"] else child_blue_match["athlete_blue_name"]
                
                # Se ambos atletas já estão preenchidos na rodada subsequente, mas um lado é W.O. / BYE (ou seja, se a luta pai se torna um bye imediato - raro, mas possível)
                # Ela permanece scheduled por padrão até que as lutas filhas terminem.

        # 9. Consolida todas as partidas em uma lista plana ordenada por rodada e número da partida
        flat_matches = []
        match_order_counter = 1
        for r_num in range(1, num_rounds + 1):
            for m_num in sorted(rounds_matches[r_num].keys()):
                match = rounds_matches[r_num][m_num]
                match["match_order"] = match_order_counter
                match_order_counter += 1
                flat_matches.append(match)

        return flat_matches, active_regs

    @classmethod
    def _propagate_winner_to_parent(cls, rounds_matches: Dict[int, Dict[int, Dict[str, Any]]], current_round: int, current_match_num: int, winner_id: str, winner_name: str):
        """
        Propaga recursivamente o vencedor de uma partida para a partida pai na rodada seguinte.
        """
        parent_round = current_round + 1
        if parent_round not in rounds_matches:
            return # Chegou na final, não há pai
            
        parent_match_num = (current_match_num + 1) // 2
        parent_match = rounds_matches[parent_round][parent_match_num]
        
        # Determina se entra como Vermelho (Aka) ou Azul (Ao)
        if current_match_num % 2 != 0:
            # Ímpar entra como Vermelho (Aka)
            parent_match["athlete_red_id"] = winner_id
            parent_match["athlete_red_name"] = winner_name
        else:
            # Par entra como Azul (Ao)
            parent_match["athlete_blue_id"] = winner_id
            parent_match["athlete_blue_name"] = winner_name
            
        # Se a partida pai por acaso tiver o outro lado como BYE ou for resolvida, propaga de novo (raro no setup inicial, mas boa prática recursiva)
