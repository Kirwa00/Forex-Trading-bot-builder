import { AstValidationResult } from '../types';

export function parseAndValidateMql5Code(code: string): AstValidationResult {
  const errors: AstValidationResult['errors'] = [];
  const passedRules: string[] = [];

  const lines = code.split('\n');

  // Rule 1: Reject MQL4 legacy order functions
  const mql4Forbidden = [
    { pattern: /\bOrderSend\s*\(/i, message: 'Forbidden legacy MQL4 function "OrderSend()". Must use MQL5 CTrade.Buy() or CTrade.Sell().' },
    { pattern: /\bOrderClose\s*\(/i, message: 'Forbidden legacy MQL4 function "OrderClose()". Must use CTrade.PositionClose().' },
    { pattern: /\bOrderSelect\s*\(/i, message: 'Forbidden legacy MQL4 function "OrderSelect()". Must use MQL5 PositionGetTicket().' },
    { pattern: /\bAsk\b/g, message: 'Forbidden MQL4 global variable "Ask". Use SymbolInfoDouble(_Symbol, SYMBOL_ASK) with NormalizeDouble().' },
    { pattern: /\bBid\b/g, message: 'Forbidden MQL4 global variable "Bid". Use SymbolInfoDouble(_Symbol, SYMBOL_BID) with NormalizeDouble().' },
    { pattern: /\bMarketInfo\s*\(/i, message: 'Forbidden MQL4 function "MarketInfo()". Use SymbolInfoDouble() or SymbolInfoInteger().' },
  ];

  let foundMql4 = false;
  lines.forEach((line, idx) => {
    mql4Forbidden.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        foundMql4 = true;
        errors.push({
          line: idx + 1,
          code: 'MQL4_FORBIDDEN',
          message,
          severity: 'error'
        });
      }
    });
  });

  if (!foundMql4) {
    passedRules.push('MQL5 Trade Syntax (No MQL4 legacy functions detected)');
  }

  // Rule 2: Check NormalizeDouble on lot or price calculations
  const priceOrLotVars = /\b(ask|bid|sl|tp|lotSize|calculatedLot|price)\b/i;
  let hasPrices = false;
  let hasNormalize = false;

  lines.forEach((line, idx) => {
    if (priceOrLotVars.test(line) && line.includes('=')) {
      hasPrices = true;
      if (line.includes('NormalizeDouble')) {
        hasNormalize = true;
      } else if (!line.includes('input') && !line.includes('//') && !line.includes('double ask') && !line.includes('double bid')) {
        // Warning if price calculation lacks NormalizeDouble
        if (line.includes('*') || line.includes('/') || line.includes('+') || line.includes('-')) {
          errors.push({
            line: idx + 1,
            code: 'NORMALIZE_DOUBLE_RECOMMENDED',
            message: 'Price/lot arithmetic should be wrapped with NormalizeDouble(val, _Digits) to prevent invalid price errors in MT5.',
            severity: 'warning'
          });
        }
      }
    }
  });

  if (hasNormalize || !hasPrices) {
    passedRules.push('NormalizeDouble Precision Safeguard');
  }

  // Rule 3: Check CTrade or Position loops
  if (code.includes('CTrade') || code.includes('m_trade') || code.includes('CheckEntryBuy')) {
    passedRules.push('CTrade Class Integration');
  } else {
    errors.push({
      code: 'MISSING_CTRADE',
      message: 'Code lacks standard CTrade execution wrapper.',
      severity: 'warning'
    });
  }

  // Rule 4: Balanced Brackets & Syntax
  let openBraces = 0;
  let openParens = 0;
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '{') openBraces++;
    if (code[i] === '}') openBraces--;
    if (code[i] === '(') openParens++;
    if (code[i] === ')') openParens--;
  }

  if (openBraces !== 0) {
    errors.push({
      code: 'UNBALANCED_BRACES',
      message: `Unbalanced curly braces '{' and '}'. Difference: ${openBraces}`,
      severity: 'error'
    });
  } else {
    passedRules.push('Balanced AST Code Brackets');
  }

  if (openParens !== 0) {
    errors.push({
      code: 'UNBALANCED_PARENS',
      message: `Unbalanced parentheses '(' and ')'. Difference: ${openParens}`,
      severity: 'error'
    });
  }

  const isValid = errors.filter(e => e.severity === 'error').length === 0;

  return {
    isValid,
    errors,
    passedRules
  };
}
