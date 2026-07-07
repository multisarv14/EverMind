export interface RuntimeEvent {
  stage: string;
  message: string;
  timestamp: string;
}

export function connectRuntimeStream(
  onEvent: (event: RuntimeEvent) => void
) {
  const source = new EventSource(
    "http://localhost:5000/api/v1/runtime/stream"
  );

  source.onmessage = (e) => {
    onEvent(JSON.parse(e.data));
  };

  source.onerror = () => {
    source.close();
  };

  return source;
}
