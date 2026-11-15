// Escala de 1 a 10 da tela para humor, estresse e qualidade do sono.
// As regras de shared/ continuam na escala interna de 0 a 100 (faixa pessoal: média ± 2 DP, piso de DP de 5 pontos).
// Conversão linear: resposta n (1 a 10) é gravada como n × 10. Como a regra compara com a faixa pessoal do próprio
// astronauta, multiplicar tudo por 10 não muda nenhuma decisão: o piso de 5 pontos vira meio ponto na tela.
// Dados antigos (qualquer valor de 0 a 100) continuam válidos: na tela aparecem divididos por 10.
// Arquivo PURO (sem React, testado em Node).

/** Indicadores respondidos de 1 a 10 no check-in. */
export const TEN_POINT = ['sleep_quality', 'stress', 'mood_score'] as const;
export const isTenPoint = (indicator: string) => (TEN_POINT as readonly string[]).includes(indicator);

export const TEN_FACTOR = 10;
/** Resposta de 1 a 10 → valor gravado (escala interna de 0 a 100). */
export const toStored = (answer: number) => Math.min(10, Math.max(1, Math.round(answer))) * TEN_FACTOR;
/** Valor gravado (0 a 100, inclusive dados antigos) → valor na escala da tela (0 a 10). */
export const toTen = (stored: number) => stored / TEN_FACTOR;
/** Valor gravado → resposta mais próxima de 1 a 10 (para começar o check-in na última resposta). */
export const toAnswer = (stored: number) => Math.min(10, Math.max(1, Math.round(stored / TEN_FACTOR)));
/** Texto da tela: inteiro quando é inteiro, senão uma casa ("7" ou "7.3"). */
export const fmtTen = (stored: number) => (Number.isFinite(stored) ? String(Number(toTen(stored).toFixed(1))) : '–');

/** Rótulos das pontas da escala de 1 a 10. */
export const TEN_LABELS: Record<(typeof TEN_POINT)[number], [string, string]> = {
  sleep_quality: ['Very poor', 'Excellent'],
  stress: ['Very low', 'Very high'],
  mood_score: ['Very low', 'Very good'],
};
