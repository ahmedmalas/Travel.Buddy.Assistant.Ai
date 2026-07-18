import { useState } from 'react';
import {
  PACKING_CATEGORIES,
  type PackingCategory,
  type PackingItem,
} from '../../store/tripDomain';
import { useSharedTripStore } from '../../store/TripStoreContext';
import {
  EmptyState,
  Field,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBanner,
  inputClassName,
} from './shared/ui';

export function PackingListsPanel() {
  const {
    trip,
    packingProgress,
    packingTemplates,
    upsertPackingItem,
    deletePackingItem,
    applyPackingTemplate,
    upsertPackingList,
  } = useSharedTripStore();
  const activeList = trip.packingLists[0];
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<PackingCategory>('clothing');
  const [customCategory, setCustomCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [assignedTravellerId, setAssignedTravellerId] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!activeList) {
    return (
      <Panel title="Packing lists">
        <EmptyState title="No packing list" body="Create a packing list to begin." />
      </Panel>
    );
  }

  const handleAddItem = () => {
    if (!itemName.trim()) {
      setFeedback('Item name is required.');
      return;
    }
    const item: PackingItem = {
      id: crypto.randomUUID(),
      name: itemName.trim(),
      category,
      customCategory: category === 'custom' ? customCategory.trim() : '',
      quantity: Math.max(1, quantity),
      packed: false,
      assignedTravellerId: assignedTravellerId || null,
    };
    upsertPackingItem(activeList.id, item);
    setItemName('');
    setQuantity(1);
    setFeedback('Packing item added.');
  };

  return (
    <Panel
      title="Packing lists"
      description="Track packed items, quantities, and traveller assignments with reusable templates."
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-300">
          Progress: <span className="font-semibold text-white">{packingProgress.progressPercent}%</span> (
          {packingProgress.packedItems}/{packingProgress.totalItems} packed)
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-sky-400" style={{ width: `${packingProgress.progressPercent}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {packingTemplates.map((template) => (
          <SecondaryButton
            key={template.key}
            type="button"
            onClick={() => {
              applyPackingTemplate(activeList.id, template.key);
              setFeedback(`Applied template: ${template.name}`);
            }}
          >
            Use {template.name}
          </SecondaryButton>
        ))}
        <SecondaryButton
          type="button"
          onClick={() => {
            upsertPackingList({
              id: crypto.randomUUID(),
              name: 'Custom list',
              templateKey: null,
              items: [],
            });
            setFeedback('Custom packing list added.');
          }}
        >
          Add custom list
        </SecondaryButton>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Item name" htmlFor="packing-item-name">
          <input id="packing-item-name" className={inputClassName} value={itemName} onChange={(e) => setItemName(e.target.value)} />
        </Field>
        <Field label="Category" htmlFor="packing-category">
          <select id="packing-category" className={inputClassName} value={category} onChange={(e) => setCategory(e.target.value as PackingCategory)}>
            {PACKING_CATEGORIES.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </Field>
        <Field label="Custom category" htmlFor="packing-custom-category">
          <input id="packing-custom-category" className={inputClassName} value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} disabled={category !== 'custom'} />
        </Field>
        <Field label="Quantity" htmlFor="packing-quantity">
          <input id="packing-quantity" type="number" min={1} className={inputClassName} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </Field>
        <Field label="Assigned traveller" htmlFor="packing-traveller">
          <select id="packing-traveller" className={inputClassName} value={assignedTravellerId} onChange={(e) => setAssignedTravellerId(e.target.value)}>
            <option value="">Unassigned</option>
            {trip.travellers.map((traveller) => (
              <option key={traveller.id} value={traveller.id}>{traveller.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <PrimaryButton type="button" onClick={handleAddItem}>Add packing item</PrimaryButton>
      </div>

      <div className="mt-6 space-y-4">
        {trip.packingLists.map((list) => (
          <section key={list.id} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <h4 className="font-medium text-white">{list.name}</h4>
            {list.items.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="Empty list" body="Add items or apply a template." />
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {list.items.map((item) => {
                  const assignee = trip.travellers.find((traveller) => traveller.id === item.assignedTravellerId);
                  return (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                      <label className="flex items-center gap-2 text-slate-200">
                        <input
                          type="checkbox"
                          checked={item.packed}
                          onChange={(e) =>
                            upsertPackingItem(list.id, {
                              ...item,
                              packed: e.target.checked,
                            })
                          }
                        />
                        <span>
                          {item.name} × {item.quantity} · {item.category === 'custom' ? item.customCategory || 'custom' : item.category}
                          {assignee ? ` · ${assignee.name}` : ''}
                        </span>
                      </label>
                      <SecondaryButton type="button" onClick={() => deletePackingItem(list.id, item.id)}>
                        Delete
                      </SecondaryButton>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </Panel>
  );
}
