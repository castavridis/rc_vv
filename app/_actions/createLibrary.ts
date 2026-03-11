'use server'

import supabase from './supabase'

export async function createLibrary(userId: string, name: string) {
  const { data, error } = await supabase
    .from('libraries')
    .insert({ name, user_id: Number(userId) })
    .select('id, name, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}
