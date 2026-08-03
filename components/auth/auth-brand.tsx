import Link from "next/link";
import styles from "./auth.module.css";

export function AuthBrand() {
  return (
    <Link className={styles.brand} href="/">
      <img src="/tickmint-icon.svg" alt="" />

      <span>
        Tick<span className={styles.brandMint}>Mint</span>
      </span>
    </Link>
  );
}