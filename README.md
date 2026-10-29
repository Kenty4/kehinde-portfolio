# Moneyball Crypto

A prototype for the numbers-first crypto mispricing framework discussed in ChatGPT.

## Included
- Fair-value calculator
- Growth adjustment
- Circulating-supply dilution penalty
- Moneyball Mispricing Score (MCS)
- Demo market scanner
- Revenue/TVL efficiency
- Explanation of the research workflow

## Important
The scanner currently uses illustrative data. It is not connected to live market/protocol APIs and should not be used as a trading signal.

## Formula
Base Fair Value = Annual Revenue × Comparable P/Revenue

Final Fair Value = Base Fair Value × Growth Factor × Supply Factor

MCS = Final Fair Value ÷ Current Market Cap

The next production stage should add live data, historical snapshots, token unlocks, liquidity, revenue-quality checks and backtesting.
