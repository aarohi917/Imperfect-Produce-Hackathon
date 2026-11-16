// Retry only constraints failures; permission and device errors need user action.
export async function openVisualCamera(media: Pick<MediaDevices, "getUserMedia">) {
  try {
    return await media.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  } catch (cause) {
    if (typeof cause === "object" && cause !== null && "name" in cause && (cause.name === "OverconstrainedError" || cause.name === "ConstraintNotSatisfiedError")) {
      return media.getUserMedia({ video: true, audio: false });
    }
    throw cause;
  }
}