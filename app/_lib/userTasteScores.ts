import { getAllUserRatings } from '../_actions/saveArtworkRatings'
import { computeDimensionScores, type DimensionScores } from './dimensionScores'

export async function getUserDimensionScores(userId: string): Promise<DimensionScores> {
  const ratings = await getAllUserRatings(userId)
  if (ratings.length === 0) {
    return { Sincerity: 0, Excitement: 0, Competence: 0, Sophistication: 0, Ruggedness: 0 }
  }
  return computeDimensionScores(ratings)
}
