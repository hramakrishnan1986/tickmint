type TickMintLogoProps = {
  compact?: boolean;
};

export function TickMintLogo({ compact = false }: TickMintLogoProps) {
  return (
    <div
      className={`tickmintLogo ${compact ? 'compact' : ''}`}
      aria-label="TickMint"
    >
      <img
        src={
          compact
            ? '/tickmint-icon-premium.svg'
            : '/tickmint-logo-premium.svg'
        }
        alt="TickMint"
        draggable={false}
      />
    </div>
  );
}
