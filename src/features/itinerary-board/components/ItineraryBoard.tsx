import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { buildItineraryBoardView } from '../adapters/itineraryBoard.adapter';
import { DayRail } from './DayRail';
import { DayTimeline } from './DayTimeline';
import { AddActivityFromPlacesPanel } from './AddActivityFromPlacesPanel';
import { ActivityEditorSheet } from './ActivityEditorSheet';
import { DaySummaryBar } from './DaySummaryBar';
import { useTripCommand } from '../../trip-command/state/useTripCommand';
import type { UpdateActivityDraft } from '../model/itinerary.types';

export function ItineraryBoard() {
  const {
    activeTrip,
    activeItineraryDay,
    setActiveItineraryDay,
    addActivityToDay,
    updateActivity,
    removeActivity,
  } = useTripCommand();
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const boardView = useMemo(() => buildItineraryBoardView(activeTrip), [activeTrip]);
  const selectedBlock = boardView.timelineBlocks.find((block) => block.activityId === selectedActivityId) ?? null;

  useEffect(() => {
    if (selectedActivityId && boardView.timelineBlocks.some((block) => block.activityId === selectedActivityId)) {
      return;
    }
    setSelectedActivityId(boardView.timelineBlocks[0]?.activityId ?? null);
  }, [boardView.timelineBlocks, selectedActivityId]);

  if (!activeTrip) {
    return (
      <EmptyState
        title="No active trip"
        description="Select an active trip from the command centre before planning itinerary days."
      />
    );
  }

  if (activeTrip.itineraryDays.length === 0) {
    return (
      <EmptyState
        title="No itinerary days yet"
        description="Create your first trip day in trip setup before scheduling saved places."
      />
    );
  }

  if (!activeItineraryDay) {
    return (
      <EmptyState
        title="Select a planning day"
        description="Choose a day from the day rail to begin scheduling saved places."
      />
    );
  }

  const selectedDayId = activeItineraryDay.id;

  function handleAddActivity(draft: {
    placeId: string;
    startTime: string;
    durationMinutes: number;
    bufferAfterMinutes: number;
    notes?: string;
  }) {
    const nextActivityId = addActivityToDay({
      dayId: selectedDayId,
      ...draft,
    });
    if (nextActivityId) {
      setSelectedActivityId(nextActivityId);
    }
  }

  function handleUpdateActivity(activityId: string, updates: UpdateActivityDraft) {
    updateActivity({ activityId, updates });
  }

  function handleRemoveActivity(activityId: string) {
    removeActivity({ activityId });
    if (selectedActivityId === activityId) {
      setSelectedActivityId(null);
    }
  }

  return (
    <div className="space-y-4">
      <DaySummaryBar metrics={boardView.summary} />
      <div className="grid gap-5 xl:grid-cols-[0.32fr_0.68fr]">
        <DayRail
          activeDayId={selectedDayId}
          days={activeTrip.itineraryDays}
          onSelectDay={(dayId) => {
            setActiveItineraryDay(dayId);
            setSelectedActivityId(null);
          }}
        />
        <div className="space-y-4">
          <DayTimeline blocks={boardView.timelineBlocks} onSelectActivity={setSelectedActivityId} selectedActivityId={selectedActivityId} />
          <AddActivityFromPlacesPanel eligiblePlaces={boardView.eligiblePlaces} onAddActivity={handleAddActivity} />
          <ActivityEditorSheet block={selectedBlock} onRemoveActivity={handleRemoveActivity} onUpdateActivity={handleUpdateActivity} />
        </div>
      </div>
    </div>
  );
}
