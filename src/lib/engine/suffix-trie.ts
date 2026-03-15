import type { SuffixItem } from "../types/addons.js";

// ---------------------------------------------------------------------------
// Reversed-character trie for suffix matching.
//
// Instead of checking every suffix against every stem (O(suffixes * stems)),
// we build a trie from reversed suffix strings. To find all suffixes that
// match a stem, we walk backwards from the end of the stem through the trie,
// collecting all complete suffixes encountered. This is O(max_suffix_length)
// per stem instead of O(suffixes).
// ---------------------------------------------------------------------------

export interface SuffixTrieNode {
  readonly children: Map<string, SuffixTrieNode>;
  /** Suffixes whose fix string ends at this node. */
  readonly suffixes: SuffixItem[];
}

function createNode(): SuffixTrieNode {
  return { children: new Map(), suffixes: [] };
}

/** Build a reversed-character trie from all suffix fix values. */
export function buildSuffixTrie(suffixes: readonly SuffixItem[]): SuffixTrieNode {
  const root = createNode();

  for (const suffix of suffixes) {
    const fix = suffix.fix.toLowerCase();
    let node = root;
    // Insert reversed: walk from last char to first
    for (let i = fix.length - 1; i >= 0; i--) {
      const ch = fix.charAt(i);
      let child = node.children.get(ch);
      if (!child) {
        child = createNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    // This node marks the end of a complete suffix
    node.suffixes.push(suffix);
  }

  return root;
}

export interface SuffixMatch {
  readonly suffix: SuffixItem;
  readonly strippedStem: string;
}

/**
 * Find all suffixes that match the end of a stem by walking the trie
 * backwards from the last character of the stem.
 *
 * Returns all matches with the stripped stem (stem with suffix removed).
 */
export function findMatchingSuffixes(trie: SuffixTrieNode, stem: string): SuffixMatch[] {
  const matches: SuffixMatch[] = [];
  let node = trie;

  for (let i = stem.length - 1; i >= 0; i--) {
    const ch = stem.charAt(i);
    const child = node.children.get(ch);
    if (!child) break; // no further matches possible

    node = child;

    // If this node has complete suffixes, the characters from stem[i..end]
    // match a suffix. The stripped stem is stem[0..i).
    if (node.suffixes.length > 0) {
      const strippedStem = stem.slice(0, i);
      if (strippedStem.length > 0) {
        for (const suffix of node.suffixes) {
          matches.push({ suffix, strippedStem });
        }
      }
    }
  }

  return matches;
}
