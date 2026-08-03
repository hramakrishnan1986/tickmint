function TickMintLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`tickmintLogo ${compact ? "compact" : ""}`}>
      <div className="logoIcon">
        <img
          src="/tickmint-icon.svg"
          alt="TickMint"
          width={compact ? 34 : 40}
          height={compact ? 34 : 40}
        />
      </div>

      {!compact && (
        <div className="logoWordmark">
          <span className="logoTick">Tick</span>
          <span className="logoMint">Mint</span>
        </div>
      )}
    </div>
  );
}