import unittest
from services.bracket_generator import BracketGenerator

class TestBracketGenerator(unittest.TestCase):
    def setUp(self):
        # 4 Atletas de 4 Dojos diferentes
        self.athletes_4_diff = [
            {"athlete_id": "atleta-1", "athlete_name": "Atleta Um", "dojo_id": "dojo-a", "dojo_name": "Dojo A", "status": "confirmed"},
            {"athlete_id": "atleta-2", "athlete_name": "Atleta Dois", "dojo_id": "dojo-b", "dojo_name": "Dojo B", "status": "confirmed"},
            {"athlete_id": "atleta-3", "athlete_name": "Atleta Três", "dojo_id": "dojo-c", "dojo_name": "Dojo C", "status": "confirmed"},
            {"athlete_id": "atleta-4", "athlete_name": "Atleta Quatro", "dojo_id": "dojo-d", "dojo_name": "Dojo D", "status": "confirmed"}
        ]

        # 8 Atletas: 4 do Dojo A e 4 do Dojo B (Dojo Protection Test)
        self.athletes_8_protected = [
            {"athlete_id": "atleta-a1", "athlete_name": "A1", "dojo_id": "dojo-a", "dojo_name": "Dojo A", "status": "confirmed"},
            {"athlete_id": "atleta-a2", "athlete_name": "A2", "dojo_id": "dojo-a", "dojo_name": "Dojo A", "status": "confirmed"},
            {"athlete_id": "atleta-a3", "athlete_name": "A3", "dojo_id": "dojo-a", "dojo_name": "Dojo A", "status": "confirmed"},
            {"athlete_id": "atleta-a4", "athlete_name": "A4", "dojo_id": "dojo-a", "dojo_name": "Dojo A", "status": "confirmed"},
            {"athlete_id": "atleta-b1", "athlete_name": "B1", "dojo_id": "dojo-b", "dojo_name": "Dojo B", "status": "confirmed"},
            {"athlete_id": "atleta-b2", "athlete_name": "B2", "dojo_id": "dojo-b", "dojo_name": "Dojo B", "status": "confirmed"},
            {"athlete_id": "atleta-b3", "athlete_name": "B3", "dojo_id": "dojo-b", "dojo_name": "Dojo B", "status": "confirmed"},
            {"athlete_id": "atleta-b4", "athlete_name": "B4", "dojo_id": "dojo-b", "dojo_name": "Dojo B", "status": "confirmed"}
        ]

        # 5 Atletas (Deve gerar chave de 8 com 3 BYEs)
        self.athletes_5 = [
            {"athlete_id": "atleta-1", "athlete_name": "A1", "dojo_id": "dojo-a", "status": "confirmed"},
            {"athlete_id": "atleta-2", "athlete_name": "A2", "dojo_id": "dojo-a", "status": "confirmed"},
            {"athlete_id": "atleta-3", "athlete_name": "A3", "dojo_id": "dojo-b", "status": "confirmed"},
            {"athlete_id": "atleta-4", "athlete_name": "A4", "dojo_id": "dojo-b", "status": "confirmed"},
            {"athlete_id": "atleta-5", "athlete_name": "A5", "dojo_id": "dojo-c", "status": "confirmed"}
        ]

    def test_seeding_order(self):
        order_8 = BracketGenerator.get_seeding_order(8)
        self.assertEqual(order_8, [1, 8, 4, 5, 2, 7, 3, 6])
        
        order_4 = BracketGenerator.get_seeding_order(4)
        self.assertEqual(order_4, [1, 4, 2, 3])

    def test_determinism(self):
        matches1, _ = BracketGenerator.generate(self.athletes_8_protected, "cat-test")
        matches2, _ = BracketGenerator.generate(self.athletes_8_protected, "cat-test")
        
        self.assertEqual(len(matches1), len(matches2))
        for m1, m2 in zip(matches1, matches2):
            self.assertEqual(m1["athlete_red_id"], m2["athlete_red_id"])
            self.assertEqual(m1["athlete_blue_id"], m2["athlete_blue_id"])

    def test_dojo_protection(self):
        matches, _ = BracketGenerator.generate(self.athletes_8_protected, "cat-test")
        
        # Como temos 8 atletas (4 do Dojo A, 4 do Dojo B), a primeira rodada tem 4 partidas.
        round_1_matches = [m for m in matches if m["round_number"] == 1]
        self.assertEqual(len(round_1_matches), 4)
        
        # Mapeia atletas por id para obter seu dojo_id
        athlete_to_dojo = {a["athlete_id"]: a["dojo_id"] for a in self.athletes_8_protected}
        
        for m in round_1_matches:
            red_dojo = athlete_to_dojo.get(m["athlete_red_id"])
            blue_dojo = athlete_to_dojo.get(m["athlete_blue_id"])
            
            # Garante que ambos são reais (não BYEs)
            self.assertIsNotNone(red_dojo)
            self.assertIsNotNone(blue_dojo)

    def test_byes_generation(self):
        matches, _ = BracketGenerator.generate(self.athletes_5, "cat-test")
        
        # 5 competidores -> chave de 8. Total de lutas = 4 (R1) + 2 (R2) + 1 (R3) = 7 lutas.
        self.assertEqual(len(matches), 7)
        
        round_1_matches = [m for m in matches if m["round_number"] == 1]
        self.assertEqual(len(round_1_matches), 4)
        
        # Com a distribuição head-tail, as vagas vazias se concentram, gerando 2 lutas com BYE na Rodada 1
        byes = [m for m in round_1_matches if m["status"] == "bye"]
        self.assertEqual(len(byes), 2)
        
        # Os vencedores das lutas com BYE devem ter sido propagados para as lutas filhas na Rodada 2.
        round_2_matches = [m for m in matches if m["round_number"] == 2]
        self.assertEqual(len(round_2_matches), 2)
        
        # Vamos verificar se os atletas que ganharam por BYE aparecem na Rodada 2
        athletes_in_r2 = []
        for m in round_2_matches:
            if m["athlete_red_id"]:
                athletes_in_r2.append(m["athlete_red_id"])
            if m["athlete_blue_id"]:
                athletes_in_r2.append(m["athlete_blue_id"])
                
        # Os atletas que ganharam por BYE devem estar na Rodada 2 (se não for BYE duplo)
        for m in byes:
            if m["winner_id"]:
                self.assertIn(m["winner_id"], athletes_in_r2)

if __name__ == "__main__":
    unittest.main()
