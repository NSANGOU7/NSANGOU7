import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

// Suggestions de spécifications auto courantes (style eBay)
const SUGGESTED_SPECS = [
  'Cylindrée',
  'Fabricant',
  'Marque',
  'Nombre de cylindres',
  'Numéro de pièce fabricant',
  'Type',
  'Type de carburant',
  'Numéro du fabricant',
  'Type de produit',
  'Déplacement',
  'Puissance (ch)',
  'Couleur',
  'Matière',
  'Poids',
  'Dimensions',
  'Année de fabrication',
  'Garantie',
  'Pays de fabrication',
];

const SpecificationsEditor = ({ specifications, onChange }) => {
  // Convert object to array of [key, value] pairs for ordered editing
  const entries = Object.entries(specifications || {});

  const updateKey = (index, newKey) => {
    const newEntries = entries.map((entry, i) => (i === index ? [newKey, entry[1]] : entry));
    const obj = {};
    newEntries.forEach(([k, v]) => {
      if (k) obj[k] = v;
    });
    onChange(obj);
  };

  const updateValue = (index, newValue) => {
    const newEntries = entries.map((entry, i) => (i === index ? [entry[0], newValue] : entry));
    const obj = {};
    newEntries.forEach(([k, v]) => {
      if (k) obj[k] = v;
    });
    onChange(obj);
  };

  const addRow = (presetKey = '') => {
    const obj = { ...specifications };
    // Find unique key (append number if needed)
    let key = presetKey || 'Nouveau critère';
    let n = 2;
    while (key in obj) {
      key = `${presetKey || 'Nouveau critère'} ${n}`;
      n++;
    }
    obj[key] = '';
    onChange(obj);
  };

  const removeRow = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    const obj = {};
    newEntries.forEach(([k, v]) => {
      obj[k] = v;
    });
    onChange(obj);
  };

  const usedKeys = new Set(entries.map(([k]) => k));
  const availableSuggestions = SUGGESTED_SPECS.filter((s) => !usedKeys.has(s));

  return (
    <div className="space-y-3" data-testid="specifications-editor">
      {entries.length === 0 && (
        <p className="text-sm text-slate-500 italic">
          Aucune caractéristique. Ajoutez-en avec les suggestions ci-dessous.
        </p>
      )}

      {entries.map(([key, value], index) => (
        <div
          key={`spec-${index}`}
          className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
          data-testid={`spec-row-${index}`}
        >
          <Input
            value={key}
            onChange={(e) => updateKey(index, e.target.value)}
            placeholder="Critère (ex: Cylindrée)"
            className="font-medium"
            data-testid={`spec-key-${index}`}
          />
          <Input
            value={value}
            onChange={(e) => updateValue(index, e.target.value)}
            placeholder="Valeur (ex: 2.0)"
            data-testid={`spec-value-${index}`}
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
            data-testid={`spec-remove-${index}`}
            aria-label="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {/* Add custom row */}
      <Button
        type="button"
        variant="outline"
        onClick={() => addRow('')}
        className="w-full border-dashed"
        data-testid="spec-add-custom"
      >
        <Plus size={16} className="mr-2" />
        Ajouter un critère personnalisé
      </Button>

      {/* Quick-add suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2 font-medium">Suggestions rapides :</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addRow(suggestion)}
                className="text-xs px-2 py-1 border border-slate-200 hover:border-slate-900 hover:bg-slate-50 rounded transition-colors"
                data-testid={`spec-suggest-${suggestion.replace(/\s+/g, '-')}`}
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationsEditor;
