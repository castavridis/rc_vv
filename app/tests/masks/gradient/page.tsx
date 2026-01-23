import styles from './gradient.module.css'

export default function GradientPage (): React.ReactElement {
  return (
    <div className="fixed inset-0 bg-zinc-800">
      <div className={`${styles.sincerity} absolute inset-0`}>
        <div className="absolute top-0 left-0 p-12">
          <div className="p-4 border border-orange-500/50 bg-orange-400/25 text-orange-700 font-bold backdrop-blur-xs rounded-sm shadow-sm">
            Sincerity
          </div>
        </div>
      </div>
      <div className={`${styles.excitement} absolute inset-0`}>
        <div className="absolute top-0 right-0 p-12">
          <div className="p-4 border border-fuchsia-500/50 bg-fuchsia-400/25 text-fuchsia-700 font-bold backdrop-blur-xs rounded-sm shadow-sm">
            Excitement
          </div>
        </div>
      </div>
      <div className={`${styles.competence} absolute inset-0`}>
        <div className="absolute bottom-0 right-0 p-12">
          <div className="p-4 border border-white/50 bg-white/25 text-white font-bold backdrop-blur-xs rounded-sm shadow-sm">
            Competence
          </div>
        </div>
      </div>
      <div className={`${styles.sophistication} absolute inset-0 z-20`}>
        <div className="border border-white/50 bg-white/25 text-white font-bold backdrop-blur-xs p-4 absolute top-[40%] left-[50%] rotate-6 rounded-sm shadow-md z-10 translate-x-[-50%] translate-y-[-50%]">Sophistication</div>
        <div className={`flex w-full h-full items-center justify-center ${styles.funnel_display_300}`}>
          <div className="border border-indigo-700 p-12 rounded-sm text-white bg-indigo-950/50 backdrop-blur-xs shadow-xl max-w-120">
            <h1 className="text-4xl font-bold">Hello. This is an experiment.</h1>
            <p className="mt-2">This element is contained by a masked parent.</p>
          </div>
        </div>
      </div>
      <div className={`${styles.ruggedness} absolute inset-0`}>
        <div className="absolute bottom-0 left-0 p-12">
          <div className="p-4 border border-black/50 bg-black/15 text-black font-bold backdrop-blur-xs rounded-sm shadow-sm">
            Ruggedness
          </div>
        </div>
      </div>
      <div className={`${styles.noise} absolute inset-0 mix-blend-plus-lighter`} />
      {/* 
      <div className={`${styles.sincerity} ${styles.debug} absolute inset-0`} />
      <div className={`${styles.excitement} ${styles.debug} absolute inset-0`} />
      <div className={`${styles.competence} ${styles.debug} absolute inset-0`} />
      <div className={`${styles.sophistication} ${styles.debug} absolute inset-0`} />
      <div className={`${styles.ruggedness} ${styles.debug} absolute inset-0`} />
      */}

    </div>
  )
}