import { useMemo } from 'react';
import type { SearchResult } from '../types';

interface UseSearchOptions {
  query: string;
  items: SearchResult[];
  filter?: string;
  language?: 'ru' | 'en';
  limit?: number;
}

// Умная функция нечеткого поиска
export function fuzzyMatch(query: string, text: string): { score: number; positions: number[] } {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Точное совпадение
  if (textLower === queryLower) {
    return { score: 100, positions: Array.from({ length: queryLower.length }, (_, i) => i) };
  }

  // Совпадение начала
  if (textLower.startsWith(queryLower)) {
    return { score: 90, positions: Array.from({ length: queryLower.length }, (_, i) => i) };
  }

  // Поиск подстроки — возвращаем ВСЕ позиции совпавшей подстроки
  const index = textLower.indexOf(queryLower);
  if (index !== -1) {
    return { score: 80, positions: Array.from({ length: queryLower.length }, (_, i) => index + i) };
  }

  // Нечеткое совпадение — возвращаем все позиции совпавших символов
  let queryIndex = 0;
  const positions: number[] = [];
  let consecutiveMatches = 0;
  let maxConsecutiveMatches = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      positions.push(i);
      queryIndex++;
      consecutiveMatches++;
      maxConsecutiveMatches = Math.max(maxConsecutiveMatches, consecutiveMatches);
    } else if (queryIndex > 0) {
      consecutiveMatches = 0;
    }
  }

  if (queryIndex === queryLower.length) {
    const density = positions.length / text.length;
    const consecutiveBonus = maxConsecutiveMatches * 5;
    const score = Math.round(50 * density + consecutiveBonus);
    return { score: Math.min(score, 75), positions };
  }

  return { score: 0, positions: [] };
}

// Подсветка совпадений
export function highlightText(text: string, query: string, positions: number[]): string[] {
  if (!query || positions.length === 0) {
    return [text];
  }
  
  const ranges: [number, number][] = [];
  let rangeStart = positions[0];
  let rangeEnd = positions[0];
  
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] === rangeEnd + 1) {
      rangeEnd = positions[i];
    } else {
      ranges.push([rangeStart, rangeEnd]);
      rangeStart = positions[i];
      rangeEnd = positions[i];
    }
  }
  ranges.push([rangeStart, rangeEnd]);
  
  const parts: string[] = [];
  let lastIndex = 0;
  
  ranges.forEach(([start, end]) => {
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(text.slice(start, end + 1));
    lastIndex = end + 1;
  });
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts;
}

export function useSearch({ query, items, filter = 'all', language = 'ru', limit = 15 }: UseSearchOptions) {
  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    const scoredResults: (SearchResult & { score: number; positions: number[] })[] = [];

    items.forEach(item => {
      // Фильтрация по типу
      if (filter !== 'all' && item.type !== filter) {
        return;
      }

      // Получаем текст на текущем языке
      const title = language === 'en' && (item as any).titleEn ? (item as any).titleEn : item.title;
      const description = language === 'en' && (item as any).descriptionEn ? (item as any).descriptionEn : item.description;
      
      const searchableText = [title, description, ...item.keywords].join(' ');
      
      let totalScore = 0;
      let allPositions: number[] = [];

      searchTerms.forEach(term => {
        // Поиск по заголовку (наивысший вес)
        const titleMatch = fuzzyMatch(term, title);
        if (titleMatch.score > 0) {
          totalScore += titleMatch.score * 2;
          allPositions = [...allPositions, ...titleMatch.positions];
        }

        // Поиск по описанию
        const descMatch = fuzzyMatch(term, description);
        if (descMatch.score > 0) {
          totalScore += descMatch.score;
        }

        // Поиск по ключевым словам
        item.keywords.forEach(keyword => {
          const keywordMatch = fuzzyMatch(term, keyword);
          if (keywordMatch.score > 0) {
            totalScore += keywordMatch.score * 1.5;
          }
        });
      });

      // Бонус за приоритет
      const priorityBonus = (item.priority || 5) * 2;
      totalScore += priorityBonus;

      if (totalScore > 0) {
        scoredResults.push({
          ...item,
          score: Math.round(totalScore),
          positions: allPositions,
        });
      }
    });

    // Сортировка по релевантности
    scoredResults.sort((a, b) => b.score - a.score);

    return scoredResults.slice(0, limit);
  }, [query, filter, language, items, limit]);

  // Группировка по типу
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof results> = {};
    results.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [results]);

  return { results, groupedResults };
}
