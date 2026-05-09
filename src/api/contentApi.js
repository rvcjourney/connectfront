import { supabase } from '../lib/supabase';

export async function fetchActiveCategories() {
  try {
    const { data, error } = await supabase
      .from('mentor_categories')
      .select('id, name, slug, icon, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('mentor_categories:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('mentor_categories fetch failed:', e?.message);
    return [];
  }
}

export async function fetchActiveCategoryNames() {
  const rows = await fetchActiveCategories();
  return rows.map((r) => r.name).filter(Boolean);
}
