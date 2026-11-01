import type { Toy } from './toysApi'
import { ageFrom } from './toysApi'

/**
 * What the toys say when you stop by. Placeholders are filled from their card:
 *   {name} {room} {house} {age} {origin} {memory} {personality} {friend}
 * A line whose placeholder has nothing to fill it with is skipped.
 */
export const CHATTER: string[] = [
  // hellos
  "Oh! Hi! I didn't hear you come in.",
  "Hello hello! It's me, {name}!",
  'You came to visit! Best day ever.',
  'Psst. Over here. Hi.',
  'Oh, it’s you! I was hoping it would be you.',
  'Welcome to {house}! Mind the stairs.',
  'Hi! Want to see my favourite spot in {room}?',
  "Good timing, I just finished my nap.",
  "Hello! I've been practising my wave. How was that?",
  'Hi hi hi hi hi. Sorry. Excited.',
  // about themselves
  "I'm {age}, you know. Very grown up.",
  "Did you know I'm from {origin}? I've come a long way!",
  "Everyone says I'm {personality}. I think that's fair.",
  "I'll never forget {memory}.",
  'Remember {memory}? I think about it a lot.',
  'My favourite memory? {memory}. Obviously.',
  "I like living in {room}. It's very me.",
  "Some days I feel very {personality}. Today is one of them.",
  "{name} is my name and cuddles are my game.",
  "I'm small, but my heart is huge. Scientifically.",
  // housemates
  'Have you seen {friend}? They were here a minute ago.',
  '{friend} borrowed my blanket and never gave it back.',
  "{friend} and I are having a tea party later. You're invited.",
  "Don't tell {friend}, but I ate the last biscuit.",
  "{friend} snores. Just so you know.",
  "I think {friend} is planning a surprise. I'm not supposed to know.",
  '{friend} says hi too. Probably.',
  "{friend} keeps rearranging the cushions. It's a whole thing.",
  // the house
  'The view from up here is the best.',
  "I counted the stairs today. There are a lot of them.",
  "I've been watching the clouds from the window.",
  'Shh, the kettle is about to whistle.',
  'Somebody left the fairy lights on again. I love it.',
  "I'm thinking of redecorating {room}. More pillows.",
  'This house creaks at night. It’s talking, I think.',
  'If you need me, I’ll be by the window.',
  'Every house needs a good reading corner. Ours is perfect.',
  'I tried climbing the ladder. Halfway was enough.',
  "The plants and I have an understanding.",
  'I found a crumb under the table. Treasure!',
  // feelings
  "I'm having a very good day. Thank you for asking. You didn't, but still.",
  'Do you ever just feel cosy? I feel cosy.',
  "Sometimes I just sit and think about snacks.",
  "I'm not sleepy. I'm just resting my eyes. For an hour.",
  'Hugs are free here. Just so you know.',
  "I'm a little shy, but I like you.",
  "You look like you need a cuddle. I'm available.",
  "I feel brave today! Maybe I'll go upstairs.",
  "I'm the happiest plush in the whole house. Don't tell the others.",
  "I missed you! It's been ages. Or a day. Same thing.",
  // little wisdom
  'A nap a day keeps the grumpies away.',
  'The secret to being soft is a big heart.',
  'Life is better with a friend to sit next to.',
  "If you're ever sad, find something fluffy.",
  "Tea first. Everything else second.",
  'Small steps still go places.',
  'Every adventure needs a snack break.',
  "It's okay to be a little bit lost. I am, often.",
  'Good things come to those who sit very still.',
  'Being loved makes you real. I read that somewhere.',
  // silly
  "I tried to whistle. Turns out I don't have lips.",
  "I'm not short, I'm fun-sized.",
  'I have exactly zero thoughts right now. It’s lovely.',
  "I'm practising my serious face. Is it working? Oh no, I smiled.",
  'If I sit very still, I am invisible. Probably.',
  "I'm on a top-secret mission. It's a nap.",
  "Did someone say dessert?",
  'One day I will reach the top shelf. One day.',
  "I lost a button once. We don't talk about it.",
  'I am 100% fluff and 0% worries.',
  // plans
  'Tomorrow I’m going to explore the whole house.',
  "Let's have a picnic! Indoors. Where it's safe.",
  "I'm saving a seat for you at dinner.",
  "I'm planning a party. The guest list is everyone.",
  'Can we go on another adventure soon?',
  "I'd like to see the sea one day. Or a big puddle.",
  "Next time, bring snacks. And yourself.",
  "I'm writing a book. It's about naps.",
  'Maybe I’ll learn to dance. Just a little shuffle.',
  'When it rains, we should all watch it from the window.',
  // goodbyes and asides
  "Don't go yet! Okay, you can go. But come back.",
  'See you soon? Promise?',
  'Oh! Was that a thunderclap? No, just my tummy.',
  "Tell everyone {name} says hello!",
  "I'll be right here. I'm very good at being right here.",
  'Bye for now! Mind the ladder on your way out.',
  'Come back tomorrow, I might have news.',
  "Thanks for stopping by. You're my favourite visitor.",
  "Don't forget me! Haha, as if you could.",
  "I'll keep {room} cosy for you.",
  // a few more cosy ones
  'I like it when the light comes in through the window.',
  "Everything is better after a good stretch. Mmmmm.",
  "Do you think the moon has toys too?",
  'I have a pocket full of hugs today.',
  "We should take a photo! I'll do my best side.",
  "I'm working on being brave. I've been brave twice today.",
  "If you listen closely, the house hums a little song.",
  "I don't need much. Just friends, blankets and you.",
  "Today's mood: soft.",
  'Thank you for giving me a home.',
]

/** A random line for this toy, never the same as the one they said last. */
export function pickLine(toy: Toy, where: { house: string; room: string }, housemates: Toy[], last?: string): string {
  const friends = housemates.filter((t) => t.id !== toy.id)
  const fill: Record<string, string> = {
    name: toy.name,
    room: where.room,
    house: where.house,
    age: ageFrom(toy.birthday),
    origin: toy.origin,
    memory: toy.memory ? toy.memory.trim().replace(/[.!]+$/, '') : '',
    personality: toy.personality ? toy.personality.split(/[,.;]/)[0].trim() : '',
    friend: friends.length ? friends[(Math.random() * friends.length) | 0].name : '',
  }
  const fits = (line: string) => [...line.matchAll(/\{(\w+)\}/g)].every(([, k]) => fill[k])
  const pool = CHATTER.filter(fits)
  let line = pool[(Math.random() * pool.length) | 0]
  for (let tries = 0; line === last && tries < 5; tries++) line = pool[(Math.random() * pool.length) | 0]
  return line.replace(/\{(\w+)\}/g, (_, k) => fill[k])
}
