export const DEMO_STORIES = [
  {id:"demo-1",title:"The Last Train Home",authorName:"Maya Chen",category:"Slice of Life",readingTime:"3 min read",body:`The train was nearly empty when I noticed the woman carrying a birthday cake.

Not a box. Not a paper bag. A cake, balanced carefully on both palms, with six candles trembling in the cold air.

She caught me looking.

“Late,” she said.

I smiled. “Me too.”

At the next station, the doors opened and a little boy ran in. He shouted, “Mum!” and the woman’s whole face changed.

She handed him the cake.

I never found out what they were celebrating. I only remember thinking that some people spend their whole lives arriving late to the right moment.`},
  {id:"demo-2",title:"A Blue Door in November",authorName:"Ishan Rao",category:"Mystery",readingTime:"4 min read",body:`Every November, a blue door appeared at the end of my street.

Nobody else could see it.

The first year, I ignored it.

The second year, I knocked.

There was no handle. No letterbox. Just a brass number: 11.

When I woke the next morning, my father’s old watch was on my bedside table.

He had died twelve years earlier.

The following November, the door appeared again.

This time, I knocked twice.

Something on the other side knocked back.`},
  {id:"demo-3",title:"Things My Mother Leaves On Read",authorName:"Nora Bell",category:"Romance",readingTime:"2 min read",body:`My mother leaves messages on read.

She reads “Did you eat?” and never answers.

She reads “I got the job!” and waits three hours before sending a thumbs-up.

But every Sunday, she puts oranges in a bowl outside my apartment.

I know because the first time I asked her why, she said, “You always forget to buy fruit.”

Yesterday I texted her:

“I love you.”

She left it on read.

Then, twenty minutes later, someone knocked.

There were oranges in her hands.`},
  {id:"demo-4",title:"The Smallest Dragon",authorName:"Leo Park",category:"Fantasy",readingTime:"3 min read",body:`The dragon was smaller than a teacup.

He lived behind the sugar jar and sneezed sparks whenever I made coffee.

“You are supposed to be terrifying,” I told him.

He looked offended.

On Tuesday, a burglar climbed through the kitchen window.

The dragon flew directly at him.

He missed.

He hit the burglar in the nose.

The burglar screamed, dropped my grandmother’s necklace, and ran.

The dragon landed in my cereal bowl.

“Terrifying,” I said.

He puffed smoke.

We both agreed it counted.`},
  {id:"demo-5",title:"Please Leave the Light On",authorName:"Sana Kapoor",category:"Horror",readingTime:"4 min read",body:`My grandmother always said never turn off the hallway light.

Not because she was afraid of the dark.

Because something in the dark was afraid of us.

I laughed when she told me.

Then she died.

For the first three nights, I slept with the hallway light on.

On the fourth night, I woke to darkness.

The bulb had burned out.

At the end of the hallway, someone whispered my name.

Then the light clicked back on.

I was alone.

Except for the muddy footprints leading from the front door to my bedroom.`},
  {id:"demo-6",title:"A Very Serious Meeting",authorName:"Arjun Mehta",category:"Humor",readingTime:"2 min read",body:`The cat sat on my laptop during the meeting.

I moved him.

He returned.

I moved him again.

He returned with a look that suggested I was missing the point.

My manager asked why my camera was off.

“My cat is currently blocking the screen.”

“Can you move him?”

I looked at the cat.

The cat looked at me.

“No,” I said.

There was a pause.

Then my manager laughed.

“Honestly? Fair.”`},
  {id:"demo-7",title:"After the Rain",authorName:"Priya Sen",category:"Poetry",readingTime:"2 min read",body:`After the rain,

the city remembers
how to shine.

Windows hold small suns.
Puddles keep pieces of sky.

Someone laughs
under a broken umbrella.

Someone runs
because they are late.

And somewhere,
behind a third-floor curtain,

someone decides
to begin again.`},
  {id:"demo-8",title:"The Woman Who Collected Sundays",authorName:"Eli Morgan",category:"Fiction",readingTime:"5 min read",body:`She collected Sundays in glass jars.

Not the whole day, of course.

Only the quiet parts.

The sound of a kettle.

A dog barking three streets away.

The soft scrape of a newspaper being folded.

She said Mondays were too loud to keep.

Fridays disappeared too quickly.

But Sundays lingered.

When she died, her daughter found forty-seven jars in the attic.

She opened one.

The room filled with sunlight.

For the first time in months, she stayed home.`}
];

export function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr;
}
export function getInitials(name=""){
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase() || "?";
}
export function readingTimeFromWords(text=""){
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1,Math.ceil(words/190))} min read`;
}