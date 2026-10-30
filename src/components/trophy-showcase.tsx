"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";

export function TrophyShowcase() {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<ModelViewerElement | null>(null);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    const fail = () => { if (!disposed) setStatus("error"); };
    const timer = window.setTimeout(fail, 30000);
    import("@google/model-viewer").then(({ ModelViewerElement }) => {
      if (disposed) return;
      ModelViewerElement.dracoDecoderLocation = "/trofeo/draco/";
      const element = document.createElement("model-viewer") as ModelViewerElement;
      viewer.current = element;
      const attributes = {
        src: "/trofeo/cfp-v03-web.glb", alt: "Trofeo Champions Fútbol Prohibido en 3D. Usa las flechas para girarlo.",
        "camera-controls": "", "disable-zoom": "", "disable-pan": "",
        "touch-action": "pan-y", "camera-orbit": "25deg 80deg auto",
        "field-of-view": "30deg", "environment-image": "neutral", exposure: "0.8",
        "interaction-prompt": "none", loading: "eager", tabindex: "0",
      };
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
      element.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const orbit = element.getCameraOrbit();
        const theta = orbit.theta * 180 / Math.PI + (event.key === "ArrowLeft" ? -10 : event.key === "ArrowRight" ? 10 : 0);
        const phi = Math.max(25, Math.min(145, orbit.phi * 180 / Math.PI + (event.key === "ArrowUp" ? -10 : event.key === "ArrowDown" ? 10 : 0)));
        element.cameraOrbit = `${theta}deg ${phi}deg ${orbit.radius}m`;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) element.jumpCameraToGoal();
      }, { capture: true });
      element.addEventListener("load", () => {
        window.clearTimeout(timer);
        if (!disposed) setStatus("ready");
      }, { once: true });
      element.addEventListener("error", fail);
      host.current?.append(element);
    }).catch(fail);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      viewer.current?.remove();
      viewer.current = null;
    };
  }, [active]);

  function showImage() {
    setActive(false);
    setStatus("idle");
  }

  return (
    <figure className="trophy-showcase" aria-label="Trofeo del campeonato">
      <div className="trophy-stage" data-status={status}>
        <Image className="trophy-poster" src="/trofeo/cfp-v03-poster.webp"
          alt="Trofeo dorado y negro de Champions Fútbol Prohibido, con balón y asas curvas"
          width={840} height={1120} sizes="(max-width: 767px) 90vw, 520px" preload />
        <div ref={host} className="trophy-viewer" hidden={status === "error"} />
      </div>
      <figcaption>
        <div className="trophy-controls">
          {!active || status === "error" ? (
            <button className="trophy-button" type="button" disabled={status === "error"}
              onClick={() => { setStatus("loading"); setActive(true); }}>Girar el trofeo</button>
          ) : (
            <>
              <button className="trophy-button" type="button" disabled={status !== "ready"}
                onClick={() => { if (viewer.current) { viewer.current.cameraOrbit = "25deg 80deg auto"; viewer.current.jumpCameraToGoal(); } }}>Vista inicial</button>
              <button className="trophy-button" type="button" onClick={showImage}>Ver imagen</button>
            </>
          )}
        </div>
        <p className="trophy-hint" role="status">
          {status === "loading" ? "Preparando el trofeo…" : status === "error" ? "El 3D no está disponible. Puedes seguir viendo el trofeo en imagen." : status === "ready" ? "Arrastra a los lados o usa las flechas. Desliza hacia arriba para seguir leyendo." : "La copa que todos quieren levantar."}
        </p>
      </figcaption>
    </figure>
  );
}
