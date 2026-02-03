"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/Button";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  label?: string;
}

export function SignaturePad({ onSave, onCancel, label }: SignaturePadProps) {
  const canvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  function handleClear() {
    canvasRef.current?.clear();
    setIsEmpty(true);
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  }

  return (
    <div className="space-y-4">
      {label && (
        <p className="text-sm font-medium text-slate-700">{label}</p>
      )}
      <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
        <SignatureCanvas
          ref={canvasRef}
          canvasProps={{
            className: "w-full h-48 touch-none",
            style: { touchAction: "none" },
          }}
          onEnd={() => setIsEmpty(canvasRef.current?.isEmpty() ?? true)}
        />
      </div>
      <p className="text-xs text-slate-500">
        Signez dans la zone ci-dessus (doigt ou stylet sur mobile).
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleClear}>
          Effacer
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isEmpty}
        >
          Valider la signature
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
