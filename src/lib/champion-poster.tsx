import type { CSSProperties } from "react";
import { championScore } from "@/lib/champion-poster-data";
import type { Champion } from "@/lib/knockout";

const white = "#fff7f5";
const silver = "#cdc3c5";
const red = "#ef364e";
const black = "#0b090b";
const italic = {
  fontFamily: "Barlow",
  fontStyle: "italic",
  fontWeight: 800,
} satisfies CSSProperties;

type Rival = { phase: string; name: string; image: string | null };
type Props = {
  eventName: string;
  phase: string;
  champion: Champion;
  backdrop: string;
  winnerImage: string | null;
  runnerUpImage: string | null;
  rivals: Rival[];
  vertical: boolean;
};

function Crest({
  image, size, grayscale = false,
}: {
  image: string | null;
  size: number;
  grayscale?: boolean;
}) {
  if (!image) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image} alt="" width={size} height={size}
      style={{ objectFit: "contain", flexShrink: 0, ...(grayscale ? { filter: "grayscale(100%)" } : {}) }}
    />
  );
}

export function ChampionPoster({
  eventName, phase, champion, backdrop, winnerImage, runnerUpImage, rivals, vertical,
}: Props) {
  const score = championScore(champion);
  const digits = score ? String(score[0]).length + String(score[1]).length : 0;
  const scoreSize = score
    ? Math.min(vertical ? 163 : 104, Math.floor((vertical ? 1200 : 775) / digits))
    : vertical ? 53 : 36;
  const name = champion.team.name;
  const runnerUp = champion.runner_up?.name ?? "Sin rival habilitado";
  const championSize = vertical ? (name.length > 38 ? 76 : 116) : (name.length > 35 ? 44 : 64);
  const hero = (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      width: vertical ? "100%" : 525, flexGrow: vertical ? 1 : 0, gap: vertical ? 14 : 5,
      padding: vertical ? "38px 0 34px" : "4px 0", textAlign: "center",
    }}>
      <div style={{
        ...italic, fontSize: vertical ? 160 : 80, letterSpacing: vertical ? -4 : -2,
        lineHeight: 0.87, textShadow: "0 6px 20px rgba(0,0,0,0.82)",
      }}>CAMPEÓN</div>
      {winnerImage && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          width: vertical ? 484 : 226, height: vertical ? 460 : 208,
          backgroundImage: "radial-gradient(ellipse at 50% 54%, rgba(255,116,108,0.26), rgba(104,22,35,0.18) 60%, rgba(104,22,35,0) 74%)",
        }}>
          <Crest image={winnerImage} size={vertical ? 454 : 210} />
        </div>
      )}
      <div style={{
        maxWidth: "100%", textAlign: "center", fontSize: championSize,
        letterSpacing: vertical ? -2 : -1, lineHeight: 0.92, wordBreak: "break-word",
        textShadow: "0 4px 16px rgba(0,0,0,0.85)",
      }}>{name}</div>
    </div>
  );

  const result = (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      width: "100%", textAlign: "center", gap: vertical ? 14 : 9,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        position: "relative",
        width: vertical ? 790 : "100%", height: vertical ? 179 : 111,
        color: white, backgroundColor: "#272024",
        backgroundImage: "linear-gradient(110deg, #b31430 0%, #7b1023 49%, #38292e 49%, #1b1719 100%)",
        ...italic, fontSize: scoreSize, lineHeight: 1,
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: 3,
          backgroundImage: "linear-gradient(90deg, #f75160, #c4213a 55%, #6a565d)",
        }} />
        {score ? (
          <div style={{ display: "flex", alignItems: "center", gap: vertical ? 35 : 21 }}>
            <span>{score[0]}</span>
            <div style={{
              display: "flex", flexShrink: 0, width: Math.round(scoreSize * 0.22),
              height: Math.max(4, Math.round(scoreSize * 0.055)),
              backgroundColor: "#f3bfc4",
            }} />
            <span>{score[1]}</span>
          </div>
        ) : "SIN MARCADOR"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: vertical ? 16 : 12 }}>
        <Crest image={runnerUpImage} size={vertical ? 93 : 55} />
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "flex-start",
          maxWidth: vertical ? 700 : 475, gap: 3, textAlign: "left",
        }}>
          {champion.runner_up && (
            <div style={{ color: silver, fontSize: vertical ? 24 : 16, letterSpacing: 2 }}>FINALISTA</div>
          )}
          <div style={{
            fontSize: vertical ? (runnerUp.length > 38 ? 39 : 52) : (runnerUp.length > 35 ? 27 : 36),
            lineHeight: 0.98, wordBreak: "break-word", maxWidth: "100%",
          }}>{runnerUp}</div>
        </div>
      </div>
    </div>
  );

  const titleRoute = rivals.length > 0 && (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", width: "100%",
      gap: vertical ? 16 : 9, padding: vertical ? "25px 0 12px" : "9px 0 0",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: vertical ? 16 : 10, width: "100%",
      }}>
        <div style={{
          flexGrow: 1, height: 1, backgroundImage: "linear-gradient(90deg, #2f2427, #ac4052)",
        }} />
        <div style={{
          ...italic, color: white, fontSize: vertical ? 35 : 22, letterSpacing: vertical ? 2.5 : 1.5,
        }}>RUTA AL TÍTULO</div>
        <div style={{
          flexGrow: 1, height: 1, backgroundImage: "linear-gradient(90deg, #ac4052, #2f2427)",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "center",
        width: vertical ? Math.min(948, rivals.length * 298) : "100%",
        borderTop: "1px solid #6d454e", borderBottom: "1px solid #42343a",
        backgroundImage: "linear-gradient(110deg, #191618, #2a2227 50%, #191618)",
      }}>
        {rivals.map(({ phase, name, image }, index) => (
          <div key={index} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
            padding: vertical ? "10px 6px 15px" : "5px 5px 7px", gap: vertical ? 3 : 1,
            flex: 1, minWidth: 0, maxWidth: vertical ? 290 : 220, textAlign: "center",
            borderRightWidth: index < rivals.length - 1 ? 1 : 0, borderRightColor: "#513f47",
          }}>
            <Crest image={image} size={vertical ? 80 : 44} grayscale />
            <div style={{ color: silver, fontSize: vertical ? 27 : 17, letterSpacing: 0.5 }}>
              {phase === "Cuartos de final" ? "Cuartos" : phase}
            </div>
            <div style={{
              fontSize: vertical ? (name.length > 38 ? 26 : 36) : (name.length > 35 ? 16 : 22),
              lineHeight: 0.98, wordBreak: "break-word", textAlign: "center", maxWidth: "100%",
            }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      padding: vertical ? "57px 66px 53px" : "28px 42px 23px",
      fontFamily: "Barlow", fontWeight: 700, color: white, backgroundColor: black,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backdrop} alt="" width={vertical ? 1080 : 680} height={vertical ? 1920 : 1209}
        style={{ position: "absolute", top: vertical ? 0 : -204, left: vertical ? 0 : -73 }}
      />
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        backgroundImage: vertical
          ? "linear-gradient(180deg, rgba(11,9,11,0.95) 0%, rgba(11,9,11,0.64) 10%, rgba(11,9,11,0) 24%, rgba(11,9,11,0) 49%, #0b090b 70%)"
          : "linear-gradient(90deg, rgba(11,9,11,0.14) 15%, rgba(11,9,11,0.24) 34%, #0b090b 50.5%)",
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, height: vertical ? 9 : 6, width: "100%",
        backgroundImage: "linear-gradient(90deg, #b2112d, #f83c55 38%, #5a1624 79%, #151015)",
      }} />
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0,
        width: "100%", gap: vertical ? 18 : 24, paddingBottom: vertical ? 20 : 11,
        borderBottom: "1px solid #82414c",
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "flex-start",
          width: vertical ? 650 : 790, gap: vertical ? 7 : 4,
        }}>
          <div style={{ color: silver, fontSize: vertical ? 30 : 21, letterSpacing: vertical ? 2.2 : 1.5 }}>
            CHAMPIONS FÚTBOL PROHIBIDO
          </div>
          <div style={{
            fontSize: vertical ? (eventName.length > 52 ? 40 : 56) : (eventName.length > 55 ? 29 : 36),
            lineHeight: 0.99, wordBreak: "break-word", maxWidth: "100%",
          }}>{eventName}</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", flexShrink: 0, alignSelf: "flex-start",
          fontSize: vertical ? 32 : 24, padding: vertical ? "9px 16px" : "5px 12px",
          backgroundColor: "#3e101a", border: "1px solid #ad3148",
        }}>{phase}</div>
      </div>
      {vertical ? (
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1,
          width: "100%", paddingBottom: rivals.length ? 22 : 126,
        }}>
          {hero}
          {result}
          {titleRoute}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 28 }}>
          {hero}
          <div style={{ display: "flex", flexDirection: "column", width: 563, gap: 12 }}>
            {result}
            {titleRoute}
          </div>
        </div>
      )}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        width: "100%", gap: 12, borderTop: "1px solid #76505a", paddingTop: vertical ? 17 : 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: vertical ? 9 : 7, color: white,
          fontSize: vertical ? 27 : 19, letterSpacing: vertical ? 1.3 : 0.9,
        }}>
          <div style={{
            display: "flex", width: vertical ? 10 : 7, height: vertical ? 10 : 7,
            transform: "rotate(45deg)", backgroundColor: red,
          }} />
          {champion.final.kind === "sport" ? "RESULTADO DEPORTIVO OFICIAL" : "RESOLUCIÓN ADMINISTRATIVA"}
        </div>
        <div style={{ fontSize: vertical ? 26 : 19, color: silver }}>
          champions-futbol-prohibido.vercel.app
        </div>
      </div>
    </div>
  );
}
