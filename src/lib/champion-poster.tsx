import type { Champion } from "@/lib/knockout";
import { championScore } from "@/lib/champion-poster-data";

const blue = "#a9c8fa";
const gold = "#ffda90";
const white = "#f4f7ff";
const muted = "#aebbd2";
const hexagon = "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)";

type Rival = { phase: string; name: string; image: string | null };
type Props = {
  eventName: string;
  phase: string;
  champion: Champion;
  winnerImage: string | null;
  runnerUpImage: string | null;
  rivals: Rival[];
  vertical: boolean;
};

function Crest({ image, size, subdued = false }: { image: string | null; size: number; subdued?: boolean }) {
  if (!image) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" width={size} height={size} style={{
      objectFit: "contain",
      ...(subdued ? { filter: "grayscale(100%)", opacity: 0.88 } : {}),
    }} />
  );
}

export function ChampionPoster({
  eventName, phase, champion, winnerImage, runnerUpImage, rivals, vertical,
}: Props) {
  const score = championScore(champion);
  const digits = score ? String(score[0]).length + String(score[1]).length : 0;
  const name = champion.team.name;
  const runnerUp = champion.runner_up?.name ?? "Sin rival habilitado";
  const haloSize = vertical ? 426 : 234;
  const hero = (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      width: vertical ? "100%" : 530, gap: vertical ? 10 : 4, textAlign: "center",
    }}>
      {winnerImage && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: haloSize, height: haloSize, flexShrink: 0, borderRadius: "50%",
          border: "2px solid #9a855b",
          backgroundImage: "radial-gradient(circle, #39466b 0%, #182746 62%, #121c34 100%)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: haloSize - 24, height: haloSize - 24, borderRadius: "50%",
            border: "1px solid #68718a",
          }}>
            <Crest image={winnerImage} size={vertical ? 342 : 184} />
          </div>
        </div>
      )}
      <div style={{
        fontSize: vertical ? 36 : 26, letterSpacing: vertical ? 11 : 8,
        color: gold, marginTop: vertical ? 12 : 5,
      }}>CAMPEÓN</div>
      <div style={{
        maxWidth: "100%", textAlign: "center", fontSize: vertical ? (name.length > 38 ? 72 : 104) : (name.length > 35 ? 44 : 59),
        lineHeight: 0.92, wordBreak: "break-word",
      }}>{name}</div>
    </div>
  );
  const result = (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      width: "100%", textAlign: "center",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: vertical ? 36 : 24, width: "100%", borderTop: "1px solid #4d5972",
        borderBottom: "1px solid #4d5972", backgroundColor: "#101b31",
        backgroundImage: "linear-gradient(90deg, #111d34, #1b2c4a, #111d34)",
        height: vertical ? 182 : 108, fontSize: score
          ? Math.min(vertical ? 153 : 100, Math.floor((vertical ? 1300 : 650) / digits))
          : vertical ? 54 : 37,
        lineHeight: 1,
      }}>
        {score ? <>
          <span style={{ color: gold }}>{score[0]}</span>
          <span style={{ color: blue }}>–</span>
          <span>{score[1]}</span>
        </> : "SIN MARCADOR"}
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: vertical ? 22 : 15, marginTop: vertical ? 21 : 10,
      }}>
        <Crest image={runnerUpImage} size={vertical ? 108 : 56} />
        <div style={{
          fontSize: vertical ? (runnerUp.length > 38 ? 40 : 54) : (runnerUp.length > 35 ? 28 : 35),
          color: "#d8e2f4", lineHeight: 1, maxWidth: vertical ? 685 : 390, wordBreak: "break-word",
        }}>{runnerUp}</div>
      </div>
    </div>
  );
  const path = rivals.length > 0 && (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", width: "100%",
      borderTop: "1px solid #3e4a61", paddingTop: vertical ? 28 : 12,
      gap: vertical ? 19 : 9,
    }}>
      <div style={{
        color: blue, fontSize: vertical ? 28 : 19, letterSpacing: vertical ? 5 : 3,
      }}>RUTA AL TÍTULO</div>
      <div style={{ display: "flex", justifyContent: "center", width: "100%", gap: vertical ? 14 : 10 }}>
        {rivals.map(({ phase, name, image }, index) => (
          <div key={index} style={{
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            flex: 1, maxWidth: vertical ? 270 : 220, gap: vertical ? 4 : 2,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: vertical ? 116 : 62, height: vertical ? 100 : 54,
              clipPath: hexagon, background: "#383f50",
            }}>
              <Crest image={image} size={vertical ? 69 : 37} subdued />
            </div>
            <div style={{ color: muted, fontSize: vertical ? 26 : 16 }}>
              {phase === "Cuartos de final" ? "Cuartos" : phase}
            </div>
            <div style={{
              fontSize: vertical ? (name.length > 38 ? 25 : 32) : (name.length > 35 ? 16 : 20),
              lineHeight: 1, wordBreak: "break-word", textAlign: "center", maxWidth: "100%",
            }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      width: "100%", height: "100%", padding: vertical ? "65px 72px 54px" : "24px 44px 24px",
      borderTop: (vertical ? "10px" : "6px") + " solid " + gold,
      fontFamily: "Barlow", fontWeight: 700, color: white, backgroundColor: "#081124",
      backgroundImage: "radial-gradient(ellipse at 50% 29%, #22365b 0%, #101b32 43%, #081124 79%)",
    }}>
      <div style={{
        display: "flex", flexDirection: vertical ? "column" : "row",
        alignItems: vertical ? "center" : "flex-end", justifyContent: "space-between",
        width: "100%", gap: vertical ? 6 : 24, textAlign: vertical ? "center" : "left",
        paddingBottom: vertical ? 28 : 12, borderBottom: "1px solid #4d5972",
      }}>
        <div style={{
          display: "flex", flexDirection: "column", gap: vertical ? 3 : 1,
          width: vertical ? "100%" : 806, alignItems: vertical ? "center" : "flex-start",
        }}>
          <div style={{ color: blue, fontSize: vertical ? 32 : 21, letterSpacing: vertical ? 4 : 2 }}>
            CHAMPIONS FÚTBOL PROHIBIDO
          </div>
          <div style={{
            fontSize: vertical ? (eventName.length > 55 ? 45 : 60) : (eventName.length > 55 ? 29 : 35),
            lineHeight: 1, wordBreak: "break-word", maxWidth: "100%",
            textAlign: vertical ? "center" : "left",
          }}>{eventName}</div>
        </div>
        <div style={{ color: gold, fontSize: vertical ? 39 : 27, flexShrink: 0 }}>{phase}</div>
      </div>
      {vertical ? (
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "space-around",
          flexGrow: 1, width: "100%",
        }}>
          {hero}
          {result}
          {path}
        </div>
      ) : (
        <div style={{ display: "flex", width: "100%", alignItems: "center", gap: 24 }}>
          {hero}
          <div style={{ display: "flex", flexDirection: "column", width: 558, gap: 16 }}>
            {result}
            {path}
          </div>
        </div>
      )}
      <div style={{
        display: "flex", flexDirection: vertical ? "column" : "row",
        justifyContent: "space-between", alignItems: "center",
        gap: 4, borderTop: "1px solid #4d5972", paddingTop: vertical ? 22 : 12,
      }}>
        <div style={{ fontSize: vertical ? 29 : 20, letterSpacing: vertical ? 2 : 1, color: blue }}>
          {champion.final.kind === "sport" ? "RESULTADO DEPORTIVO OFICIAL" : "RESOLUCIÓN ADMINISTRATIVA"}
        </div>
        <div style={{ fontSize: vertical ? 27 : 20, color: muted }}>
          champions-futbol-prohibido.vercel.app
        </div>
      </div>
    </div>
  );
}
