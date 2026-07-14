"use client";

import { useState, useTransition } from "react";
import { updatePropertyDetails } from "@/lib/actions/update-property-details";

const ENERGY_CLASSES = ["A4", "A3", "A2", "A1", "B", "C", "D", "E", "F", "G"];

export type PropertyDetailsInitial = {
  propertyId: string;
  price: number;
  sqm: number;
  rooms: number;
  bathrooms: number;
  city: string;
  address: string;
  postalCode: string | null;
  region: string | null;
  floor: number | null;
  hasElevator: boolean | null;
  hasGarage: boolean | null;
  energyClass: string | null;
};

export function PropertyDetailsEditor({
  initial,
}: {
  initial: PropertyDetailsInitial;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState({
    price: String(initial.price),
    sqm: String(initial.sqm),
    rooms: String(initial.rooms),
    bathrooms: String(initial.bathrooms),
    city: initial.city,
    address: initial.address,
    postalCode: initial.postalCode ?? "",
    region: initial.region ?? "",
    floor: initial.floor !== null ? String(initial.floor) : "",
    hasElevator: initial.hasElevator ?? false,
    hasGarage: initial.hasGarage ?? false,
    energyClass: initial.energyClass ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    if (error) setError(null);
  };

  const handleSave = () => {
    setError(null);

    const floorNum = values.floor.trim() ? Number(values.floor) : null;

    startTransition(async () => {
      const result = await updatePropertyDetails({
        propertyId: initial.propertyId,
        price: Number(values.price),
        sqm: Number(values.sqm),
        rooms: Number(values.rooms),
        bathrooms: Number(values.bathrooms),
        city: values.city,
        address: values.address,
        postalCode: values.postalCode,
        region: values.region,
        floor: floorNum !== null && Number.isFinite(floorNum) ? floorNum : null,
        hasElevator: values.hasElevator,
        hasGarage: values.hasGarage,
        energyClass: values.energyClass,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSaved(true);
    });
  };

  const inputClass =
    "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none disabled:opacity-50 bg-white";
  const labelClass =
    "block text-xs font-medium uppercase tracking-wider text-neutral-500 mb-1";

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        Modifica dati immobile ↗
      </button>
    );
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 px-5 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          Modifica dati immobile
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-neutral-500 hover:text-neutral-800"
        >
          Chiudi
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Prezzo (€)</label>
          <input
            type="number"
            value={values.price}
            onChange={(e) => update("price", e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Metratura (mq)</label>
          <input
            type="number"
            value={values.sqm}
            onChange={(e) => update("sqm", e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Camere</label>
          <input
            type="number"
            value={values.rooms}
            onChange={(e) => update("rooms", e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Bagni</label>
          <input
            type="number"
            value={values.bathrooms}
            onChange={(e) => update("bathrooms", e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Città</label>
        <input
          type="text"
          value={values.city}
          onChange={(e) => update("city", e.target.value)}
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Indirizzo completo</label>
        <input
          type="text"
          value={values.address}
          onChange={(e) => update("address", e.target.value)}
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>CAP</label>
          <input
            type="text"
            value={values.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Regione</label>
          <input
            type="text"
            value={values.region}
            onChange={(e) => update("region", e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Piano</label>
          <input
            type="number"
            value={values.floor}
            onChange={(e) => update("floor", e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Classe energetica</label>
          <select
            value={values.energyClass}
            onChange={(e) => update("energyClass", e.target.value)}
            disabled={isPending}
            className={inputClass}
          >
            <option value="">Non specificata</option>
            {ENERGY_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={values.hasElevator}
            onChange={(e) => update("hasElevator", e.target.checked)}
            disabled={isPending}
          />
          Ascensore
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={values.hasGarage}
            onChange={(e) => update("hasGarage", e.target.checked)}
            disabled={isPending}
          />
          Garage / Box auto
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-neutral-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isPending ? "Salvataggio…" : "Salva modifiche"}
        </button>
        {!isPending && saved && (
          <span className="text-xs text-emerald-700">✓ Salvato</span>
        )}
      </div>
    </div>
  );
}
