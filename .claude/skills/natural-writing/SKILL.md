---
name: natural-writing
description: Write prose that reads like a human wrote it, not an LLM. Use whenever drafting or editing articles, blog posts, docs, or any narrative prose for this project, especially the Tech Blog Pipeline articles. Covers the real AI tells (uniform sentence rhythm, hedging, "not just X but Y", stock vocabulary, em-dash overuse, title-case headings) and how to fix them.
---

# Natural writing

Your default prose has a texture that gives it away as machine-written. This skill
is about removing that texture. The goal isn't to beat AI detectors. It's to write
the way a thoughtful engineer writes, with rhythm and a point of view.

## The one rule that matters most: vary your rhythm

LLM prose settles into a metronome, sentence after sentence in the 18-to-24-word
range. Human prose is *bursty*. A short punch sits next to a long, winding thought
that keeps unspooling clauses well past the point where a machine would have
stopped. Then another short one. Fix your rhythm and half the other tells fix
themselves.

Bad, uniform, every sentence the same length:

> Event-driven systems provide a number of benefits for modern applications. They
> allow services to communicate without being tightly coupled together. This makes
> the overall system more resilient to individual component failures. It also
> enables teams to scale different parts of the system independently.

Good, bursty, short then long then short:

> Event-driven systems buy you one thing above all: decoupling. A service drops a
> message and moves on, never knowing or caring who picks it up, which means a
> consumer can crash, restart, and catch up later without anyone upstream noticing.
> That's the resilience story. It's also where the hard bugs live.

Read it aloud. If you never once have to catch your breath, the rhythm is too flat.

## Kill these specific tells

The "not just X, but Y" construction. "This isn't just a cache, it's a contract."
LLMs reach for this constantly. Cut it and say the thing directly.

Hedging into the polite middle. "It's worth noting that there are several factors
to consider." Take a position. If you think something is a bad idea, write that
it's a bad idea.

Rule-of-three padding. Not every list wants exactly three items. Real emphasis
often comes in twos, or in one blunt clause.

Stock vocabulary. Delve, leverage, utilize, robust, seamless, foster, landscape,
realm, tapestry, testament, crucial, pivotal, underscore, "in the ever-evolving
world of." Reach for the plain word instead: use, not utilize; helps, not
facilitates.

Hollow openers and closers. Don't open with "In today's fast-paced world." Don't
close with "In conclusion" or "Ultimately, the key takeaway is." Start on the idea
and stop when you're done.

Empty intensifiers. "Very," "really," "incredibly," "a powerful tool that." Delete
them, or swap in a concrete detail that earns the emphasis.

## Em-dashes: the overrated tell

Em-dash overuse is a real signal, but it's the weakest one and the easiest to
overcorrect. Don't ban them; humans use them. Just don't let them become your only
way to set off an aside. Rotate through commas, parentheses, a colon, or a full
stop and a fresh sentence. If a paragraph has three em-dashes, two of them are lazy.

## Formatting tells

Use sentence case for headings, not Title Case. "Designing resilient services," not
"Designing Resilient Services."

Don't over-bullet. If ideas connect, write a paragraph. Bullets earn their place
only when items are genuinely parallel and scannable, not when you've chopped an
argument into fragments to look organized.

Don't bold every other phrase. When emphasis is everywhere it means nothing.

## Specificity is the human fingerprint

Vagueness is the deepest tell, because a real writer knows things. Push every
abstraction toward a concrete detail:

- "a recent study" becomes the study's name, or you drop the appeal to authority
- "many developers" becomes a number, or a specific situation you've watched happen
- "improves performance significantly" becomes "cut p99 latency from 400ms to 90ms"
- "various tools" becomes the actual tool names

Can't be specific? That's usually the sentence telling you it isn't carrying its
weight. Cut it.

## Have a point of view

Machine prose is relentlessly neutral. Good technical writing argues. It says "most
teams reach for Kafka here and regret it," then earns the claim. Take sides, make a
recommendation, own the trade-offs. A reader should finish knowing what *you* think,
not just what the options were.

## Revision pass, before you call any draft done

1. Read it aloud. Wherever you stumble or a phrase feels stiff, rewrite it.
2. Check the rhythm. Three sentences in a row at the same length? Break one, merge
   two, drop in a fragment.
3. Hunt the tells. Search for "not just," "isn't just," "delve," "leverage,"
   "seamless," "robust," "in conclusion," "it's worth noting." Fix every hit.
4. Cut 10%. Almost every draft is padded. Remove the qualifiers, the throat-clearing,
   the sentence that just restates the one before it.
5. Check the surface. Headings in sentence case, lists that aren't smuggling prose,
   bolding used sparingly.

## The core technique: imitate, don't generate

Given a sample of the user's own writing, or a writer they admire, study its rhythm
and diction and match it. Showing a model good writing beats any list of rules. When
in doubt, ask for a paragraph they consider "sounds like me" and use it as your north
star.

## Case study: the offenses in this file's first draft

This file used to break its own rules. Keeping the receipts here, because a concrete
before-and-after teaches more than the rules alone, and because it's a reminder that
the first draft is always guilty until edited.

- **Em-dash overuse.** The original leaned on em-dashes in more than a dozen places,
  several paragraphs stacking two or three, in the very document that tells you not
  to. This was the worst offender and the most embarrassing.
- **Title Case heading.** The H1 read "Natural Writing," breaking the sentence-case
  rule three sections below it.
- **Rule-of-three flourishes.** The intro promised "rhythm, specificity, and a point
  of view," a tidy triple assembled for cadence rather than because there were
  exactly three things to say.
- **Bolded bullet leads.** Nearly every bullet opened with a bolded phrase, which is
  the "emphasis everywhere means nothing" smell. (This section keeps the bold leads
  on purpose, as scannable labels for a genuine list. That's the distinction: labels
  for parallel items, not decoration on every line.)
- **An unearned claim.** "This single habit does more than everything else combined"
  was a confident, measurable-sounding assertion with nothing behind it. It's now
  the softer, honest "half the other tells fix themselves."
