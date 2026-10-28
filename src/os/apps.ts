/** Curated from paramveer.co.uk and hackuk.network, 16 September 2026. */
export type Entry = { id: string; title: string; subtitle: string; pages: string[]; images?: string[]; url?: string; };
export type PortfolioApp = { id: string; title: string; subtitle: string; color: string; icon: string; entries: Entry[] };
const renu: Entry = {id:'renu',title:'Renu',subtitle:'NVIDIA hackathon · 2026',pages:['Built at the NVIDIA hackathon using Swift and DGX Spark.','The project write-up is still to come. See the original portfolio page for updates.'],images:['/portfolio/renu.jpg'],url:'https://www.paramveer.co.uk/projects/renu'};
const cognilink: Entry = {id:'cognilink',title:'CogniLink',subtitle:'Hack LDN · Knowunity track',pages:['An AI study companion that turns notes into active recall: spaced-repetition questions, explanations and quizzes.','Built in a 24-hour hackathon with Knowunity integration, reducing the friction between reading material and retaining it.'],url:'https://cognilink.vercel.app'};
export const apps: PortfolioApp[] = [
 {id:'hackuk',title:'HackUK',subtitle:'Free events. Real things to build.',color:'#54badd',icon:'/portfolio/hackuk.png',entries:[
  {id:'mission',title:'Making tech accessible',subtitle:'Founder · HackUK',pages:['Free hackathons and tech events for 16–18-year-olds across the UK. No experience needed.','Workshops, build sessions and a community that helps young people take their first steps into technology.'],images:['/portfolio/hackuk-event.webp'],url:'https://www.hackuk.network/'},
  {id:'leafhacks',title:'LeafHacks 26',subtitle:'London · July 2026',pages:['100 participants came together in London Victoria for LeafHacks 26.'],url:'https://www.hackuk.network/'},
  {id:'campfire',title:'Campfire Birmingham',subtitle:'February 2026 · 23 builders',pages:['Hosted at Ormiston Sandwell Community Academy, bringing 23 young builders together.'],url:'https://www.hackuk.network/'},
  {id:'counterspell',title:'Counterspell',subtitle:'Wolverhampton · November 2024',pages:['40 participants at Wolverhampton Art Gallery.'],images:['/portfolio/hackuk-event.webp'],url:'https://www.hackuk.network/'}]},
 {id:'nvidia',title:'NVIDIA',subtitle:'Renu · Hackathon 2026',color:'#76b900',icon:'/portfolio/nvidia.png',entries:[renu]},
 {id:'hack-ldn-2025',title:'Hack LDN 2025',subtitle:'CogniLink · Knowunity track',color:'#31373f',icon:'/portfolio/hack-ldn-2025.svg',entries:[cognilink]},
];
export function getApp(id?:string|null){return apps.find(app=>app.id===id);}
