"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { savePrivacySettings, previewRetention, runRetention } from "@/app/admin/privacy-actions";

type PreviewGroup = { event_id: string; event_name: string; event_status: string; state: string; eligible_before: string; count: number; history_rows: number };
type RetentionPreview = { retention_months: number; application_count: number; groups: PreviewGroup[] };
type PrivacyStatus = { notice_active: boolean; notice_version: string; notice_reviewed: boolean; retention_confirmed: boolean; retention_months: number; minors_policy_confirmed: boolean; enabled: boolean; cron_enabled: boolean; last_run: { operation: string; at: string; considered: number; anonymized: number } | null };

export function PrivacyControls({ status }: { status: PrivacyStatus }) {
  const router = useRouter();
  const [noticeActive, setNoticeActive] = useState(status.notice_active);
  const [minorsConfirmed, setMinorsConfirmed] = useState(status.minors_policy_confirmed);
  const [noticeReviewed, setNoticeReviewed] = useState(false);
  const [retentionConfirmed, setRetentionConfirmed] = useState(false);
  const [reason, setReason] = useState("");
  const [configBusy, setConfigBusy] = useState(false);
  const [configMessage, setConfigMessage] = useState("");
  const [preview, setPreview] = useState<RetentionPreview | null>(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [runBusy, setRunBusy] = useState(false);
  const [runMessage, setRunMessage] = useState("");

  async function save() {
    setConfigBusy(true); setConfigMessage("");
    try {
      const result = await savePrivacySettings({ noticeActive, minorsConfirmed, noticeReviewed, retentionConfirmed, reason });
      setConfigMessage(result.message);
      if (result.ok) { setReason(""); setNoticeReviewed(false); setRetentionConfirmed(false); router.refresh(); }
      return result.ok;
    } catch { setConfigMessage("No se pudo guardar. Conservamos tus cambios en pantalla; revisa tu sesión y vuelve a intentarlo."); return false; }
    finally { setConfigBusy(false); }
  }
  async function showPreview() {
    setPreviewBusy(true); setPreviewMessage("");
    try {
      const result = await previewRetention(); setPreviewMessage(result.message);
      if (result.ok) setPreview(result.preview as RetentionPreview);
    } catch { setPreviewMessage("No se pudo calcular la vista previa. No se modificó ningún registro."); }
    finally { setPreviewBusy(false); }
  }
  async function executeRetention() {
    setRunBusy(true); setRunMessage("");
    try {
      const result = await runRetention(); setRunMessage(result.message);
      if (result.ok) { setPreview(null); router.refresh(); }
      return result.ok;
    } catch { setRunMessage("No se pudo completar la conservación. Consulta el historial de operaciones antes de repetir."); return false; }
    finally { setRunBusy(false); }
  }

  return (
    <div className="admin-stack">
      <section className="admin-card" aria-labelledby="privacy-status-title">
        <h2 id="privacy-status-title">Estado de las condiciones</h2>
        <dl className="admin-facts">
          <div><dt>Aviso público</dt><dd>{status.notice_active ? `Activo · versión ${status.notice_version}` : "Inactivo"}</dd></div>
          <div><dt>Revisión del aviso</dt><dd>{status.notice_reviewed ? "Confirmada" : "Pendiente"}</dd></div>
          <div><dt>Conservación</dt><dd>{status.retention_months} meses · {status.retention_confirmed ? "confirmada" : "pendiente de confirmar"}</dd></div>
          <div><dt>Medidas para menores</dt><dd>{status.minors_policy_confirmed ? "Confirmadas por el propietario" : "Pendientes"}</dd></div>
          <div><dt>Inscripciones habilitables</dt><dd>{status.enabled ? "Sí, tras la decisión separada de abrir un evento" : "No"}</dd></div>
          <div><dt>Tarea diaria</dt><dd>{status.cron_enabled ? "pg_cron disponible" : "No disponible; vista previa y ejecución manual siguen disponibles"}</dd></div>
        </dl>
        <p>La confirmación del propietario no registra autorizaciones individuales ni certifica una verificación legal. La aplicación no solicita identificaciones ni fechas de nacimiento completas.</p>
        {status.last_run && <p>Última ejecución: {new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Costa_Rica" }).format(new Date(status.last_run.at))} · {status.last_run.anonymized} solicitudes anonimizadas.</p>}
      </section>

      <section className="admin-card" aria-labelledby="privacy-config-title">
        <h2 id="privacy-config-title">Configurar aviso y protección</h2>
        <label className="admin-check"><input type="checkbox" checked={noticeActive} onChange={(e) => setNoticeActive(e.target.checked)} /> Activar el aviso público versión {status.notice_version}</label>
        <label className="admin-check"><input type="checkbox" checked={minorsConfirmed} onChange={(e) => setMinorsConfirmed(e.target.checked)} /> Confirmo que aplicaré medidas proporcionadas para participantes menores y que la autorización de una plantilla no se presume por la acción del capitán.</label>
        {noticeActive && <div className="admin-stack">
          <label className="admin-check"><input type="checkbox" checked={noticeReviewed} onChange={(e) => setNoticeReviewed(e.target.checked)} /> He revisado el aviso público completo.</label>
          <label className="admin-check"><input type="checkbox" checked={retentionConfirmed} onChange={(e) => setRetentionConfirmed(e.target.checked)} /> Confirmo el plazo de seis meses y la anonimización de identificadores al vencer.</label>
        </div>}
        <label htmlFor="privacy-reason">Motivo del cambio</label>
        <textarea id="privacy-reason" value={reason} maxLength={1000} minLength={3} rows={3} onChange={(e) => setReason(e.target.value)} />
        <button className="action-link" type="button" disabled={configBusy || reason.trim().length < 3 || (noticeActive && (!minorsConfirmed || !noticeReviewed || !retentionConfirmed))} onClick={save}>{configBusy ? "Guardando…" : "Guardar configuración"}</button>
        {configMessage && <p role="status">{configMessage}</p>}
        <p>Guardar esta configuración no publica un evento ni abre sus inscripciones. La validación de servidor y Supabase sigue bloqueando la apertura si falta alguna condición.</p>
      </section>

      <section className="admin-card" aria-labelledby="retention-title">
        <h2 id="retention-title">Vista previa y conservación</h2>
        <p>Se revisan solicitudes rechazadas desde su rechazo, vencidas desde su vencimiento, solicitudes activas al terminar o cancelar el evento y equipos aprobados cuando el propietario finaliza o cancela la edición. Se eliminan Roblox y TikTok de las solicitudes y copias del historial; nombres de equipo, escudos, resultados, clasificación y campeones se conservan.</p>
        <button className="action-link" type="button" disabled={previewBusy} onClick={showPreview}>{previewBusy ? "Calculando…" : "Actualizar vista previa"}</button>
        {previewMessage && <p role="status">{previewMessage}</p>}
        {preview && <div className="retention-preview" aria-live="polite">
          <p><strong>{preview.application_count}</strong> solicitudes serían anonimizadas; plazo configurado: {preview.retention_months} meses.</p>
          {preview.groups.length ? <div className="table-scroll"><table><thead><tr><th>Evento</th><th>Estado</th><th>Registros</th><th>Historial</th><th>Referencia más antigua</th></tr></thead><tbody>{preview.groups.map((g) => <tr key={`${g.event_id}-${g.state}`}><td>{g.event_name}<br /><small>{g.event_status}</small></td><td>{g.state}</td><td>{g.count}</td><td>{g.history_rows}</td><td>{new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeZone: "America/Costa_Rica" }).format(new Date(g.eligible_before))}</td></tr>)}</tbody></table></div> : <p>No hay solicitudes elegibles ahora.</p>}
          <ConfirmAction label="Ejecutar anonimización" title="Anonimizar los registros elegibles" description={`Se modificarán hasta ${preview.application_count} solicitudes y sus copias históricas. Las estadísticas deportivas y campeones se conservan. Esta operación no se puede deshacer.`} busy={runBusy} disabled={preview.application_count === 0} message={runMessage} onConfirm={executeRetention} />
        </div>}
        {runMessage && <p role="status">{runMessage}</p>}
      </section>
    </div>
  );
}
