import type { Threat } from "../types/threat";
export const threats: Threat[] = [
  {id:"ICT-28471",source:"mock",sourceIp:"185.220.101.45",sourceCountry:"Germany",countryCode:"DE",targetState:"Maharashtra",attackType:"Credential stuffing",severity:"Critical",confidence:98,timestamp:"Just now",mitre:"T1110"},
  {id:"ICT-28470",source:"mock",sourceIp:"103.145.67.19",sourceCountry:"Indonesia",countryCode:"ID",targetState:"Karnataka",attackType:"Malware beacon",severity:"High",confidence:91,timestamp:"2 min ago",mitre:"T1071"},
  {id:"ICT-28469",source:"mock",sourceIp:"45.155.205.33",sourceCountry:"Russia",countryCode:"RU",targetState:"Delhi",attackType:"Reconnaissance",severity:"Medium",confidence:79,timestamp:"5 min ago",mitre:"T1595"},
  {id:"ICT-28468",source:"mock",sourceIp:"89.248.165.79",sourceCountry:"Netherlands",countryCode:"NL",targetState:"Tamil Nadu",attackType:"Exploit attempt",severity:"High",confidence:88,timestamp:"8 min ago",mitre:"T1190"},
  {id:"ICT-28467",source:"mock",sourceIp:"91.92.241.12",sourceCountry:"Turkey",countryCode:"TR",targetState:"Telangana",attackType:"Port scan",severity:"Low",confidence:63,timestamp:"12 min ago",mitre:"T1046"},
  {id:"ICT-28466",source:"mock",sourceIp:"5.188.206.14",sourceCountry:"Russia",countryCode:"RU",targetState:"Gujarat",attackType:"DDoS",severity:"Critical",confidence:95,timestamp:"17 min ago",mitre:"T1498"}
];
export const timelineData = [{time:"00",attacks:72},{time:"04",attacks:118},{time:"08",attacks:85},{time:"12",attacks:167},{time:"16",attacks:132},{time:"20",attacks:198},{time:"Now",attacks:156}];
export const stateData = [{state:"Maharashtra",attacks:846,share:82},{state:"Karnataka",attacks:627,share:62},{state:"Delhi",attacks:538,share:53},{state:"Tamil Nadu",attacks:402,share:40},{state:"Telangana",attacks:314,share:31}];