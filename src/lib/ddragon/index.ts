export const DDRAGON_VERSION = '14.24.1'
const FIX: Record<string,string> = {
  "Aurelion Sol":"AurelionSol", "Bel'Veth":"Belveth", "Cho'Gath":"Chogath",
  "Dr. Mundo":"DrMundo", "Fiddlesticks":"FiddleSticks", "Jarvan IV":"JarvanIV",
  "Kai'Sa":"Kaisa", "Kha'Zix":"Khazix", "Kog'Maw":"KogMaw", "K'Sante":"KSante",
  "LeBlanc":"Leblanc", "Lee Sin":"LeeSin", "Master Yi":"MasterYi",
  "Miss Fortune":"MissFortune", "Nunu & Willump":"Nunu", "Rek'Sai":"RekSai",
  "Renata Glasc":"Renata", "Tahm Kench":"TahmKench", "Twisted Fate":"TwistedFate",
  "Vel'Koz":"Velkoz", "Wukong":"MonkeyKing", "Xin Zhao":"XinZhao"
}
export function championKey(n: string) { return FIX[n] || n.replace(/[^a-zA-Z0-9]/g,'') }
export const championIcon = (n: string) => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championKey(n)}.png`
export const itemIcon = (id: number) => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${id}.png`
export const profileIcon = (id: number) => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${id}.png`
