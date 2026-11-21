import unittest
from split_engine import minimize_cash_flow

class TestSplitEngine(unittest.TestCase):
    def test_simple_three_way_split(self):
        # Alice owes 100, Bob is owed 50, Charlie is owed 50
        balances = {"Alice": -100, "Bob": 50, "Charlie": 50}
        result = minimize_cash_flow(balances)
        
        expected = [
            {"from": "Alice", "to": "Bob", "amount": 50.0},
            {"from": "Alice", "to": "Charlie", "amount": 50.0}
        ]
        # Sort results to ensure comparison works regardless of order
        self.assertEqual(len(result), 2)
        self.assertTrue(any(tx["to"] == "Bob" and tx["amount"] == 50.0 for tx in result))

    def test_already_settled(self):
        balances = {"Alice": 0, "Bob": 0}
        self.assertEqual(minimize_cash_flow(balances), [])

if __name__ == "__main__":
    unittest.main()
