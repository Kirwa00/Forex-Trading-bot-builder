import { StrategyBlueprint } from '../types';
import { MASTER_WRAPPER_MQL5_TEMPLATE } from '../data/initialData';

export function generateMql5FromBlueprint(bp: StrategyBlueprint): string {
  let template = MASTER_WRAPPER_MQL5_TEMPLATE;

  // Replace Inputs
  template = template.replace(/InpRiskPercent\s*=\s*[\d.]+;/, `InpRiskPercent    = ${bp.riskPercent.toFixed(1)};`);
  template = template.replace(/InpFixedLot\s*=\s*[\d.]+;/, `InpFixedLot       = ${bp.fixedLot.toFixed(2)};`);
  template = template.replace(/InpStopLossPips\s*=\s*\d+;/, `InpStopLossPips   = ${bp.stopLossPips};`);
  template = template.replace(/InpTakeProfitPips\s*=\s*\d+;/, `InpTakeProfitPips = ${bp.takeProfitPips};`);
  template = template.replace(/InpUseTrailing\s*=\s*(true|false);/, `InpUseTrailing    = ${bp.useTrailingStop ? 'true' : 'false'};`);
  template = template.replace(/InpTrailingPips\s*=\s*\d+;/, `InpTrailingPips   = ${bp.trailingStopPips};`);
  template = template.replace(/InpMagicNumber\s*=\s*\d+;/, `InpMagicNumber    = ${bp.magicNumber};`);

  // Build Entry Buy logic block based on selected bricks
  const buyConditions: string[] = [];
  const sellConditions: string[] = [];

  bp.bricks.forEach(brick => {
    if (brick.brickId === 'fvg') {
      buyConditions.push(`CheckFVGBuy(${brick.config.minGapPips || 3})`);
      sellConditions.push(`CheckFVGSell(${brick.config.minGapPips || 3})`);
    } else if (brick.brickId === 'ob') {
      buyConditions.push(`CheckOrderBlockBullish()`);
      sellConditions.push(`CheckOrderBlockBearish()`);
    } else if (brick.brickId === 'killzone') {
      buyConditions.push(`IsInKillzone()`);
      sellConditions.push(`IsInKillzone()`);
    } else if (brick.brickId === 'atr') {
      buyConditions.push(`GetATRVal() >= ${brick.config.minAtrPips || 8.5} * _Point * 10`);
      sellConditions.push(`GetATRVal() >= ${brick.config.minAtrPips || 8.5} * _Point * 10`);
    } else if (brick.brickId === 'ma_cross') {
      buyConditions.push(`iMA(_Symbol, _Period, ${brick.config.fastPeriod || 9}, 0, MODE_EMA, PRICE_CLOSE) > iMA(_Symbol, _Period, ${brick.config.slowPeriod || 21}, 0, MODE_EMA, PRICE_CLOSE)`);
      sellConditions.push(`iMA(_Symbol, _Period, ${brick.config.fastPeriod || 9}, 0, MODE_EMA, PRICE_CLOSE) < iMA(_Symbol, _Period, ${brick.config.slowPeriod || 21}, 0, MODE_EMA, PRICE_CLOSE)`);
    } else if (brick.brickId === 'engulfing') {
      buyConditions.push(`IsBullishEngulfing()`);
      sellConditions.push(`IsBearishEngulfing()`);
    } else if (brick.brickId === 'pdh_pdl') {
      buyConditions.push(`IsPDLSweep()`);
      sellConditions.push(`IsPDHSweep()`);
    } else if (brick.brickId === 'fib') {
      buyConditions.push(`IsInsideFibZone(0.50, 0.618)`);
      sellConditions.push(`IsInsideFibZone(0.50, 0.618)`);
    }
  });

  const buyCode = buyConditions.length > 0 ? buyConditions.join(' &&\n          ') : 'iMA(_Symbol, _Period, 9, 0, MODE_EMA, PRICE_CLOSE) > iMA(_Symbol, _Period, 21, 0, MODE_EMA, PRICE_CLOSE)';
  const sellCode = sellConditions.length > 0 ? sellConditions.join(' &&\n          ') : 'iMA(_Symbol, _Period, 9, 0, MODE_EMA, PRICE_CLOSE) < iMA(_Symbol, _Period, 21, 0, MODE_EMA, PRICE_CLOSE)';

  const customBuyLogic = `bool CheckEntryBuy()
{
   // StratoBot Brick Composition: ${bp.bricks.map(b => b.brickId).join(', ')}
   bool condition = (${buyCode});
   return condition;
}`;

  const customSellLogic = `bool CheckEntrySell()
{
   // StratoBot Brick Composition: ${bp.bricks.map(b => b.brickId).join(', ')}
   bool condition = (${sellCode});
   return condition;
}`;

  template = template.replace(/bool CheckEntryBuy\(\)[\s\S]*?\n\}/, customBuyLogic);
  template = template.replace(/bool CheckEntrySell\(\)[\s\S]*?\n\}/, customSellLogic);

  return template;
}
