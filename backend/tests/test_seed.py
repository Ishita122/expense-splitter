import os
import json

def test_dataset_json_validity():
    data_path = os.path.join("backend", "app", "data", "sample_expenses.json")
    assert os.path.exists(data_path), "Seed dataset file must exist"
    
    with open(data_path, "r") as f:
        data = json.load(f)
        
    assert "users" in data
    assert len(data["users"]) >= 2
    assert "expenses" in data
    assert all(e["amount"] > 0 for e in data["expenses"])
