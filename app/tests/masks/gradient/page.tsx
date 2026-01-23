import styles from './gradient.module.css'

export default function GradientPage (): React.ReactElement {
  return (
    <div className="fixed noise inset-0">
      <div className={`${styles.sincerity} absolute inset-0`}>

      </div>
      <div className={`${styles.noise} absolute inset-0 mix-blend-plus-lighter`}></div>
      <div className={`${styles.sincerity} ${styles.debug} absolute inset-0`} />
      <div className={`${styles.excitement} ${styles.debug} absolute inset-0`} />
      <div className={`${styles.competence} ${styles.debug} absolute inset-0`} />
      <div className={`${styles.sophistication} ${styles.debug} absolute inset-0`} />
      <div className={`${styles.ruggedness} ${styles.debug} absolute inset-0`} />
    </div>
  )
}