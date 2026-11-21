def minimize_cash_flow(balances: dict) -> list:
    """
    Simplifies debts among a group of people.
    Input: {'Alice': -100, 'Bob': 50, 'Charlie': 50} (Negative means owes, Positive means owed)
    Output: [{'from': 'Alice', 'to': 'Bob', 'amount': 50.0}, ...]
    """
    # Filter out people who are already settled (balance is 0)
    participants = {k: float(v) for k, v in balances.items() if round(v, 2) != 0}
    transactions = []

    while len(participants) > 1:
        # Find the person who owes the most (min balance) and is owed the most (max balance)
        debtor = min(participants, key=participants.get)
        creditor = max(participants, key=participants.get)

        debtor_amount = participants[debtor]
        creditor_amount = participants[creditor]

        if round(debtor_amount, 2) == 0 or round(creditor_amount, 2) == 0:
            break

        # Settle the minimum of the two absolute amounts
        settle_amount = min(abs(debtor_amount), creditor_amount)

        # Update balances
        participants[debtor] = round(debtor_amount + settle_amount, 2)
        participants[creditor] = round(creditor_amount - settle_amount, 2)

        transactions.append({
            "from": debtor,
            "to": creditor,
            "amount": round(settle_amount, 2)
        })

        # Remove settled members to avoid infinite loops
        if round(participants[debtor], 2) == 0:
            del participants[debtor]
        if round(participants[creditor], 2) == 0:
            del participants[creditor]

    return transactions
