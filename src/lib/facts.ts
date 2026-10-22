/** "prior_therapy:chemotherapy" -> "prior therapy (chemotherapy)" */
export function factLabel(key: string): string {
  const [factKey, ...rest] = key.split(':');
  const value = rest.join(':');
  const human = factKey.replace(/_/g, ' ');
  return value ? `${human} (${value.replace(/_/g, ' ')})` : human;
}
