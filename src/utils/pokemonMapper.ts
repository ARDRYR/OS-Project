export const CORE_MAPPING: Record<number, { name: string; icon: string; megaIcon: string; standing: string; megaStanding: string; color: string; accent: string }> = {
  0: {
    name: "리자몽",
    icon: "/images/리자몽기본.png",
    megaIcon: "/images/메가리자몽.png",
    standing: "/images/스탠딩/리자몽노말폼.gif",
    megaStanding: "/images/스탠딩/리자몽메가진화폼.gif",
    color: "#fee2e2",
    accent: "#ef4444",
  },
  1: {
    name: "이상해꽃",
    icon: "/images/이상해꽃.png",
    megaIcon: "/images/메가이상해꽃.png",
    standing: "/images/스탠딩/이상해꽃노말폼.gif",
    megaStanding: "/images/스탠딩/이상해꽃메가진화폼.gif",
    color: "#f0fdf4",
    accent: "#22c55e",
  },
  2: {
    name: "거북왕",
    icon: "/images/거북왕.png",
    megaIcon: "/images/메가거북왕.png",
    standing: "/images/스탠딩/거북왕노말폼.gif",
    megaStanding: "/images/스탠딩/거북왕메가진화폼.gif",
    color: "#eff6ff",
    accent: "#3b82f6",
  },
  3: {
    name: "뮤츠",
    icon: "/images/뮤츠.png",
    megaIcon: "/images/메가뮤츠.png",
    standing: "/images/스탠딩/뮤츠노말폼.gif",
    megaStanding: "/images/스탠딩/뮤츠메가진화폼.gif",
    color: "#f5f3ff",
    accent: "#8b5cf6",
  },
};

export const PROCESS_NAME_MAPPING: Record<string, string> = {
  P1: "나옹",
  P2: "아보크",
  P3: "마자용",
  P4: "셀러",
  P5: "내루미",
  P6: "또가스",
  P7: "우츠동",
  P8: "선인왕",
  P9: "데스마스",
  P10: "흉내내",
  P11: "모르페코",
  P12: "세비퍼",
  P13: "따라큐",
  P14: "개무소",
  P15: "메가자리",
};

export const getPokemonName = (pId: string) => PROCESS_NAME_MAPPING[pId] || pId;
export const getPokemonIcon = (pId: string) => {
  const name = PROCESS_NAME_MAPPING[pId];
  return name ? `/images/로켓단/${name}.png` : "";
};

export const getCoreInfo = (coreId: number) => CORE_MAPPING[coreId];
