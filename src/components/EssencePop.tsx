export default function EssencePop({ amount }: { amount: number }) {
  if (amount <= 0) return null
  return (
    <p className="essence-pop inline-flex items-center gap-1.5 rounded-full border border-aurora-400/40 bg-aurora-400/10 px-4 py-1.5 text-sm font-medium text-aurora-300">
      <span aria-hidden="true">✦</span>
      +{amount} Dream Essence
    </p>
  )
}
