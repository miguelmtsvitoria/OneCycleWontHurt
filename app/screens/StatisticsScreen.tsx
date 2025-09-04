import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker"; // npm install react-native-modal-datetime-picker
import PieChart from 'react-native-pie-chart';
import { loadExercises } from '../storage/exerciseStorage';
import { loadMyWorkouts } from '../storage/workoutDayStorage';
import { loadWorkouts } from '../storage/workoutStorage';

const BUTTONS = [
  { label: 'Last 30 days' },
  { label: 'This year' },
  { label: 'All time' },
  { label: 'Choose Dates' },
];

const PIE_LABELS = [
  'Chest', 'Back', 'Biceps', 'Triceps', 'Legs', 'Shoulders', 'Abs'
];

const PIE_COLORS = [
  '#9f1907ff', // Chest
  '#e57373',   // Back
  '#0f69c2ff',   // Legs
  '#8e24aa',   // Shoulders
  '#fbc02d',   // Biceps
  '#388e3c',   // Triceps
  '#bf8600ff',   // Abs
];

const PIE_VALUES = [
  { value: 20, color: '#9f1907ff' },    // Chest
  { value: 15, color: '#e57373' },      // Back
  { value: 25, color: '#0f69c2ff' },      // Legs
  { value: 7, color: '#8e24aa' },       // Shoulders
  { value: 10, color: '#fbc02d' },      // Biceps
  { value: 8, color: '#388e3c' },       // Triceps
  { value: 5, color: '#bf8600ff' },       // Abs
];

// Helper to parse and compare dates
function isWithinRange(dateStr: string, start: Date, end: Date) {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function getDateRange(selected: number, startDate: Date | null, endDate: Date | null) {
  const now = new Date();
  if (selected === 0) {
    // Last 30 days
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return { start, end: now, days: null };
  }
  if (selected === 1) {
    // This year
    const start = new Date(now.getFullYear(), 0, 1);
    return { start, end: now, days: null };
  }
  if (selected === 2) {
    // All time: use a very early start date
    const start = new Date(2000, 0, 1);
    return { start, end: now, days: null };
  }
  if (selected === 3 && startDate && endDate) {
    // Choose Dates
    const days: string[] = [];
    let d = new Date(startDate);
    while (d <= endDate) {
      days.push(d.toISOString().slice(0, 10)); // Format: YYYY-MM-DD
      d.setDate(d.getDate() + 1);
    }
    return { start: startDate, end: endDate, days };
  }
  return null;
}

function isWithinRangeOrDays(dateStr: string, range: { start: Date, end: Date, days: string[] | null }) {
  if (range.days) {
    // Only for "Choose Dates": match exact days
    return range.days.includes(dateStr.slice(0, 10));
  }
  // For other ranges: between start and end
  const d = new Date(dateStr);
  return d >= range.start && d <= range.end;
}

// Helper for arrow icon
function ProgressArrow({ value }: { value: number | null }) {
  if (value === null) return null;
  if (value > 0) {
    // Upward triangle
    return (
      <Ionicons name="caret-up" size={18} color="green" style={{ marginLeft: 6 }} />
    );
  }
  if (value < 0) {
    // Downward triangle
    return (
      <Ionicons name="caret-down" size={18} color="red" style={{ marginLeft: 6 }} />
    );
  }
  return null;
}

export default function StatisticsScreen() {
  const [selected, setSelected] = useState(0);

  // For date range selection
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [dateStep, setDateStep] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [stats, setStats] = useState({
    hypertrophy: 0,
    cardio: 0,
    weightLifted: 0,
    distance: 0,
    sets: 0,
  });

  const [pieValues, setPieValues] = useState<{ value: number, color: string }[]>(PIE_VALUES);
  const [progress, setProgress] = useState({
    bench1rmDiff: null as number | null,
    squat1rmDiff: null as number | null,
    deadlift1rmDiff: null as number | null,
  });

  // Open calendar when "Choose Dates" is pressed
  const handleSegmentPress = (idx: number) => {
    setSelected(idx);
    if (BUTTONS[idx].label === 'Choose Dates') {
      setCalendarVisible(true);
      setDateStep('start');
    }
  };

  // Handle date picked
  const handleConfirm = (date: Date) => {
    if (dateStep === 'start') {
      setStartDate(date);
      setDateStep('end');
    } else {
      setEndDate(date);
      setCalendarVisible(false);
    }
  };

  // Reset end date if user reopens and picks new start
  const handleCancel = () => {
    if (dateStep === 'end') {
      setCalendarVisible(false);
    } else {
      setCalendarVisible(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date | null) =>
    date ? date.toLocaleDateString() : '--/--/----';

  // Export handler
  const handleExport = async () => {
    try {
      const [exercises, workouts, workoutDays] = await Promise.all([
        loadExercises(),
        loadWorkouts(),
        loadMyWorkouts(),
      ]);
      const exportData = {
        exercises,
        workouts,
        workoutDays,
      };
      const json = JSON.stringify(exportData, null, 2);
      const fileUri = FileSystem.cacheDirectory + 'one-cycle-export.json';
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export JSON',
      });
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  useEffect(() => {
    async function calcStats() {
      const workouts = await loadMyWorkouts();
      const exercises = await loadExercises();
      const range = getDateRange(selected, startDate, endDate);
      if (!range) return;

      let hypertrophy = 0, cardio = 0, weightLifted = 0, distance = 0, sets = 0;

      // Training volume by category
      const categoryCounts: Record<string, number> = {
        Chest: 0, Back: 0, Biceps: 0, Triceps: 0, Legs: 0, Shoulders: 0, Abs: 0, Cardio: 0
      };

      // --- 1RM Progress Calculation Helper ---
      function get1RMDiff(workouts: any[], exerciseName: string) {
        const filtered = workouts
          .filter(w => isWithinRangeOrDays(w.date, range))
          .filter(w => w.exercises.some((ex: any) =>
            ex.exerciseName.toLowerCase().includes(exerciseName)
          ))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (filtered.length === 0) return null;

        const calc1RM = (ex: any) =>
          (ex.weight || 0) * (1 + ((ex.repetitions || 0) / 30));

        const best1RM = (workout: any) =>
          Math.max(
            ...workout.exercises
              .filter((ex: any) =>
                ex.exerciseName.toLowerCase().includes(exerciseName) &&
                ex.weight && ex.repetitions
              )
              .map(calc1RM),
            0
          );

        const initial1RM = best1RM(filtered[0]);
        const final1RM = best1RM(filtered[filtered.length - 1]);
        return final1RM - initial1RM;
      }
      // --- End Helper ---

      const bench1rmDiff = get1RMDiff(workouts, 'bench press');
      const squat1rmDiff = get1RMDiff(workouts, 'squat');
      const deadlift1rmDiff = get1RMDiff(workouts, 'deadlift');

      setProgress({
        bench1rmDiff: bench1rmDiff !== null ? bench1rmDiff : null,
        squat1rmDiff: squat1rmDiff !== null ? squat1rmDiff : null,
        deadlift1rmDiff: deadlift1rmDiff !== null ? deadlift1rmDiff : null,
      });

      // --- End 1RM Progress Calculation ---

      for (const w of workouts) {
        if (!isWithinRangeOrDays(w.date, range)) continue;

        let hasRepExercise = false;

        for (const ex of w.exercises) {
          // Find category by exercise name
          const meta = exercises.find(e => e.name === ex.exerciseName);
          if (meta && categoryCounts.hasOwnProperty(meta.category)) {
            categoryCounts[meta.category]++;
          }

          if (ex.exerciseType === 'Distance') {
            cardio++;
            if (typeof ex.distance === 'number' && !isNaN(ex.distance)) {
              distance += ex.distance;
            }
          }
          if (ex.exerciseType === 'Rep') {
            hasRepExercise = true;
            weightLifted += (ex.weight || 0) * (ex.repetitions || 0);
            sets++;
          }
        }

        if (hasRepExercise) {
          hypertrophy++;
        }
      }

      setStats({
        hypertrophy,
        cardio,
        weightLifted,
        distance,
        sets,
      });

      // Update pie chart values
      setPieValues(PIE_LABELS.map((cat, idx) => ({
        value: categoryCounts[cat],
        color: PIE_COLORS[idx]
      })));
    }
    calcStats();
  }, [selected, startDate, endDate]);

  return (
    <View style={styles.root}>
      {/* Top Buttons */}
      <View style={styles.segmentedControl}>
        {BUTTONS.map((btn, idx) => (
          <TouchableOpacity
            key={btn.label}
            style={[
              styles.segmentButton,
              idx === 0 && styles.segmentLeft,
              idx === BUTTONS.length - 1 && styles.segmentRight,
              selected === idx && styles.segmentSelected,
            ]}
            onPress={() => handleSegmentPress(idx)}
            activeOpacity={0.85}
          >
            <Text style={[
              styles.segmentText,
              selected === idx && styles.segmentTextSelected
            ]}>
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Show selected dates below buttons if "Choose Dates" is selected */}
      {selected === 3 && (
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeText}>
            {startDate ? formatDate(startDate) : 'Start date'} : {endDate ? formatDate(endDate) : 'End date'}
          </Text>
        </View>
      )}

      {/* Calendar popup */}
      <DateTimePickerModal
        isVisible={calendarVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        minimumDate={dateStep === 'end' && startDate ? startDate : undefined}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Statistics */}
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsBlock}>
          <Text style={styles.statsLabel}>Workouts:</Text>
          <Text style={styles.statsSubLabel}>- Hypertrophy: <Text style={styles.statsValue}>{stats.hypertrophy}</Text></Text>
          <Text style={styles.statsSubLabel}>- Cardio: <Text style={styles.statsValue}>{stats.cardio}</Text></Text>
          <Text style={styles.statsLabel}>Weight lifted: <Text style={styles.statsValue}>{stats.weightLifted.toLocaleString()} kg</Text></Text>
          <Text style={styles.statsLabel}>Distance covered: <Text style={styles.statsValue}>{(stats.distance).toFixed(1)} km</Text></Text>
          <Text style={styles.statsLabel}>Sets: <Text style={styles.statsValue}>{stats.sets}</Text></Text>
        </View>

        {/* Training Volume Pie */}
        <Text style={styles.sectionTitle}>Training volume:</Text>
        <View style={styles.pieRow}>
          {pieValues.reduce((sum, v) => sum + v.value, 0) > 0 ? (
            <>
              <PieChart
                widthAndHeight={140}
                series={pieValues}
              />
              <View style={styles.pieLegendSpacer} /> {/* Add spacer */}
              <View style={styles.pieLegend}>
                {PIE_LABELS.map((label, idx) => (
                  <View key={label} style={styles.legendRow}>
                    <View style={[styles.legendColor, { backgroundColor: PIE_COLORS[idx] }]} />
                    <Text style={styles.legendText}>{label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={{ color: '#888', fontStyle: 'italic' }}>No data for selected dates</Text>
          )}
        </View>

        {/* Progress */}
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.statsBlock}>
          <Text style={styles.statsLabel}>
            1RM Bench press:{' '}
            <Text style={styles.statsValue}>
              {progress.bench1rmDiff !== null
                ? `${progress.bench1rmDiff >= 0 ? '+' : ''}${progress.bench1rmDiff.toFixed(1)} kg `
                : '-'}
            </Text>
            <ProgressArrow value={progress.bench1rmDiff} />
          </Text>
          <Text style={styles.statsLabel}>
            1RM Squat:{' '}
            <Text style={styles.statsValue}>
              {progress.squat1rmDiff !== null
                ? `${progress.squat1rmDiff >= 0 ? '+' : ''}${progress.squat1rmDiff.toFixed(1)} kg `
                : '-'}
            </Text>
            <ProgressArrow value={progress.squat1rmDiff} />
          </Text>
          <Text style={styles.statsLabel}>
            1RM Deadlift:{' '}
            <Text style={styles.statsValue}>
              {progress.deadlift1rmDiff !== null
                ? `${progress.deadlift1rmDiff >= 0 ? '+' : ''}${progress.deadlift1rmDiff.toFixed(1)} kg `
                : '-'}
            </Text>
            <ProgressArrow value={progress.deadlift1rmDiff} />
          </Text>
        </View>
      </ScrollView>

      {/* Import/Export Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.importBtn}>
          <Ionicons name="cloud-download-outline" size={20} color="white" style={{ marginRight: 6 }} />
          <Text style={styles.bottomBtnText}>Import JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Ionicons name="cloud-upload-outline" size={20} color="#9f1907ff" style={{ marginRight: 6 }} />
          <Text style={[styles.bottomBtnText, { color: '#9f1907ff' }]}>Export JSON</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e0e0e0' },
  segmentedControl: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 18,
    marginBottom: 18,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#9f1907ff',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    width: 400,
    height: 40,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: '#9f1907ff',
  },
  segmentLeft: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  segmentRight: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  segmentSelected: {
    backgroundColor: '#f7bdb7',
  },
  segmentText: {
    color: '#9f1907ff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    textAlignVertical: 'center', // Add this line
  },
  segmentTextSelected: {
    color: '#9f1907ff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
    color: '#000000ff',
    marginLeft: 2,
  },
  statsBlock: {
    marginBottom: 18,
    marginLeft: 4,
  },
  statsLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  statsSubLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    marginBottom: 2,
  },
  statsValue: {
    color: '#000000ff',
    fontWeight: 'bold',
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 6,
  },
  pieLegendSpacer: {
    width: 29, // Adjust the width as needed for spacing
  },
  pieLegend: {
    flex: 1,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  bottomButtons: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9f1907ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#9f1907ff',
    elevation: 2,
  },
  bottomBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dateRangeContainer: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  dateRangeText: {
    fontSize: 13,
    color: '#000',
    fontWeight: 'bold',
  },
});
