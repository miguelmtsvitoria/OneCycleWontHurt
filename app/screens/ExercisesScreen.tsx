import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Exercise, ExerciseCategory } from '../models/Exercise';
import { Workout } from '../models/WorkoutDay'; // Add this import if not present
import { addExercise, initializeDefaultExercises, saveExercises } from '../storage/exerciseStorage';
import { loadMyWorkouts } from '../storage/workoutDayStorage';

const categories: ExerciseCategory[] = [
	'Chest', 'Back', 'Legs', 'Shoulders', 'Triceps', 'Biceps', 'Abs', 'Cardio',
];

const typeOptions = [
    { label: 'Weight', value: 'Rep' },
    { label: 'Time', value: 'Time' },
    { label: 'Distance', value: 'Distance' },
    { label: 'Calisthenics', value: 'Calisthenics' }
];

type ExerciseStats = {
    pr:
        | { weight: number; reps: number }
        | { time: number }
        | { distance: number; time: number }
        | { reps: number }
        | null;
    timesTrained: number;
};

async function getExerciseStats(exerciseName: string): Promise<ExerciseStats> {
    const workouts: Workout[] = await loadMyWorkouts();
    let pr: any = null;
    let timesTrained = 0;

    workouts.forEach(w => {
        const sets = w.exercises.filter(e => e.exerciseName === exerciseName);
        if (sets.length > 0) {
            timesTrained += 1;
            sets.forEach(set => {
                if (set.weight && set.repetitions) {
                    // Rep type
                    if (
                        !pr ||
                        (set.weight ?? 0) > (pr.weight ?? 0) ||
                        ((set.weight ?? 0) === (pr.weight ?? 0) && (set.repetitions ?? 0) > (pr.reps ?? 0))
                    ) {
                        pr = { weight: set.weight ?? 0, reps: set.repetitions ?? 0 };
                    }
                } else if (set.time && !set.weight && !set.distance && !set.repetitions) {
                    // Time type
                    if (!pr || (set.time ?? 0) > (pr.time ?? 0)) {
                        pr = { time: set.time ?? 0 };
                    }
                } else if (set.distance && set.time) {
                    // Distance type
                    if (
                        !pr ||
                        (set.distance ?? 0) > (pr.distance ?? 0) ||
                        ((set.distance ?? 0) === (pr.distance ?? 0) && (set.time ?? Infinity) < (pr.time ?? Infinity))
                    ) {
                        pr = { distance: set.distance ?? 0, time: set.time ?? 0 };
                    }
                } else if (set.repetitions && !set.weight && !set.time && !set.distance) {
                    // Calisthenics type
                    if (!pr || (set.repetitions ?? 0) > (pr.reps ?? 0)) {
                        pr = { reps: set.repetitions ?? 0 };
                    }
                }
            });
        }
    });

    return { pr, timesTrained };
}

export default function ExercisesScreen() {
    const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('Chest');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'Rep' | 'Time' | 'Distance' | 'Calisthenics'>('Rep');
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // NEW
    const [infoModal, setInfoModal] = useState<{ visible: boolean, exercise: Exercise | null }>({ visible: false, exercise: null });
    const [oneRmData, setOneRmData] = useState<{ date: string, oneRm: number }[]>([]);
    const [zoomStage, setZoomStage] = useState(3); // 1 to 5, default 3
    const [zoomWindow, setZoomWindow] = useState<{start: number, end: number}>({start: 0, end: 0});
    const [exerciseStats, setExerciseStats] = useState<{ [name: string]: ExerciseStats }>({});
    const [exerciseResults, setExerciseResults] = useState<{ value: string, date: string }[]>([]); // NEW

    // Zoom stage config
    const zoomStages: { days: number; label: 'monthYear' | 'monthDay'; pan: number }[] = [
        { days: 365, label: 'monthYear', pan: 100 },
        { days: 100, label: 'monthYear', pan: 20 },
        { days: 30,  label: 'monthDay',  pan: 10 },
        { days: 15,  label: 'monthDay',  pan: 5 },
        { days: 7,   label: 'monthDay',  pan: 2 },
    ];

    useFocusEffect(
        React.useCallback(() => {
            initializeDefaultExercises().then(setExercises);
            // Also update stats for all exercises
            (async () => {
                const allStats: { [name: string]: ExerciseStats } = {};
                const allExercises = await initializeDefaultExercises();
                for (const ex of allExercises) {
                    allStats[ex.name] = await getExerciseStats(ex.name);
                }
                setExerciseStats(allStats);
            })();
        }, [])
    );

    const handleAddExercise = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);
        const newExercise: Exercise = {
            name: newName.trim(),
            category: selectedCategory,
            type: newType,
        };
        const updated = await addExercise(newExercise);
        setExercises(updated);
        setShowModal(false);
        setNewName('');
        setNewType('Rep');
        setIsSaving(false);
        // Update stats
        const stats = await getExerciseStats(newExercise.name);
        setExerciseStats(prev => ({ ...prev, [newExercise.name]: stats }));
    };

    const handleDeleteExercise = async (exerciseName: string) => {
        const updated = exercises.filter(e => e.name !== exerciseName);
        await saveExercises(updated);
        setExercises(updated);
        setDeleteConfirm(null);
        // Remove stats
        setExerciseStats(prev => {
            const copy = { ...prev };
            delete copy[exerciseName];
            return copy;
        });
    };

    // Helper to get last N days as YYYY-MM-DD strings
    function getLastNDates(n: number) {
        const dates: string[] = [];
        const today = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(d.toISOString().slice(0, 10));
        }
        return dates;
    }

    const handleInfoPress = async (exercise: Exercise) => {
        const workouts = await loadMyWorkouts();

        if (exercise.type === 'Rep') {
            const oneRmByDate: { [date: string]: number[] } = {};
            workouts.forEach(w => {
                w.exercises.forEach(e => {
                    if (e.exerciseName === exercise.name && e.weight && e.repetitions) {
                        let oneRm = 0;
                        if (e.repetitions === 1) {
                            oneRm = e.weight;
                        } else {
                            oneRm = e.weight * (1 + (e.repetitions / 30));
                        }
                        if (!oneRmByDate[w.date]) {
                            oneRmByDate[w.date] = [];
                        }
                        oneRmByDate[w.date].push(oneRm);
                    }
                });
            });

            const allDates = Object.keys(oneRmByDate).sort();
            const data = allDates.map(date => ({
                date,
                oneRm: Math.max(...oneRmByDate[date]),
            }));

            const stage = 2;
            const { days } = zoomStages[stage];
            setZoomStage(stage + 1);

            const start = Math.max(0, data.length - days);
            setOneRmData(data);
            setZoomWindow({ start, end: data.length });
            setExerciseResults([]); // clear
            setInfoModal({ visible: true, exercise });
        } else if (exercise.type === 'Calisthenics') {
            // Gather all repetitions (and time if present) for this exercise, most recent first
            const repsByDate: { [date: string]: { reps: number, time?: number }[] } = {};
            workouts.forEach(w => {
                w.exercises.forEach(e => {
                    if (e.exerciseName === exercise.name && e.repetitions) {
                        if (!repsByDate[w.date]) repsByDate[w.date] = [];
                        repsByDate[w.date].push({ reps: e.repetitions, time: e.time });
                    }
                });
            });

            const allDates = Object.keys(repsByDate).sort();
            // For each date, take the max reps (and time if present)
            const data = allDates.map(date => {
                const maxReps = Math.max(...repsByDate[date].map(r => r.reps));
                // If any set has time, show the max time for that day
                const maxTime = Math.max(...repsByDate[date].map(r => r.time ?? 0));
                return {
                    date,
                    reps: maxReps,
                    time: maxTime > 0 ? maxTime : undefined,
                };
            });

            // Show a graph of repetitions (and optionally time)
            setZoomStage(3);
            setZoomWindow({ start: Math.max(0, data.length - zoomStages[2].days), end: data.length });
            setOneRmData(data); // reuse oneRmData for chart, but with reps/time
            setExerciseResults([]); // clear
            setInfoModal({ visible: true, exercise });
        } else if (exercise.type === 'Time') {
            // Gather all times for this exercise, most recent first
            const results: { value: string, date: string }[] = [];
            workouts.forEach(w => {
                w.exercises.forEach(e => {
                    if (e.exerciseName === exercise.name && e.time) {
                        results.push({
                            value: `${e.time} seconds`,
                            date: w.date,
                        });
                    }
                });
            });
            results.sort((a, b) => b.date.localeCompare(a.date));
            setExerciseResults(results);
            setOneRmData([]); // clear
            setInfoModal({ visible: true, exercise });
        } else if (exercise.type === 'Distance') {
            // Gather all distance+time for this exercise, most recent first
            const results: { value: string, date: string }[] = [];
            workouts.forEach(w => {
                w.exercises.forEach(e => {
                    if (e.exerciseName === exercise.name && e.distance && e.time) {
                        results.push({
                            value: `${e.distance}km ${e.time}min`,
                            date: w.date,
                        });
                    }
                });
            });
            results.sort((a, b) => b.date.localeCompare(a.date));
            setExerciseResults(results);
            setOneRmData([]); // clear
            setInfoModal({ visible: true, exercise });
        } else {
            setExerciseResults([]);
            setOneRmData([]);
            setInfoModal({ visible: true, exercise });
        }
    };

    // Zoom in/out
    const handleZoom = (direction: 'in' | 'out') => {
        let newStage = zoomStage;
        if (direction === 'in' && zoomStage < 5) newStage++;
        if (direction === 'out' && zoomStage > 1) newStage--;
        if (newStage === zoomStage) return;

        const { days } = zoomStages[newStage - 1];
        const center = Math.floor((zoomWindow.start + zoomWindow.end) / 2);
        let start = Math.max(0, center - Math.floor(days / 2));
        let end = start + days;
        if (end > oneRmData.length) {
            end = oneRmData.length;
            start = Math.max(0, end - days);
        }
        setZoomStage(newStage);
        setZoomWindow({ start, end });
    };

    // Pan left/right
    const handlePan = (direction: 'left' | 'right') => {
        const { days, pan } = zoomStages[zoomStage - 1];
        let start = zoomWindow.start;
        let end = zoomWindow.end;
        if (direction === 'left') {
            start = Math.max(0, start - pan);
            end = start + days;
        } else {
            end = Math.min(oneRmData.length, end + pan);
            start = end - days;
            if (start < 0) {
                start = 0;
                end = days;
            }
        }
        // Clamp to data
        if (end > oneRmData.length) {
            end = oneRmData.length;
            start = Math.max(0, end - days);
        }
        setZoomWindow({ start, end });
    };

    // Helper for x axis labels
    function getXAxisLabels(data: { date: string }[], labelType: 'monthYear' | 'monthDay') {
        if (data.length === 0) return [];
        const first = data[0].date;
        const last = data[data.length - 1].date;
        const mid = data[Math.floor(data.length / 2)].date;
        const fmt = (d: string) => {
            const date = new Date(d);
            if (labelType === 'monthYear') {
                return date.toLocaleString('default', { month: 'short', year: '2-digit' });
            } else {
                return date.toLocaleString('default', { month: 'short', day: 'numeric' });
            }
        };
        return data.map((d, idx) => {
            if (idx === 0) return fmt(first);
            if (idx === Math.floor(data.length / 2)) return fmt(mid);
            if (idx === data.length - 1) return fmt(last);
            return '';
        });
    }

    return (
        <View style={styles.container}>			
            {/* Category Buttons Row (fixed) */}
            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                    {categories.map((category) => (
                        <Pressable
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category && styles.categoryButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.categoryButtonText,
                                    selectedCategory === category && styles.categoryButtonTextActive,
                                ]}
                            >
                                {category}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Header with Add Button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12, paddingHorizontal: 16 }}>
                <Text style={[styles.header, { flex: 1 }]}>Exercises for {selectedCategory}</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowModal(true)}
                >
                    <Text style={styles.addButtonText}>＋ Add Exercise</Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable content below */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {exercises
                    .filter((e) => e.category === selectedCategory)
                    .map((exercise) => {
                        const isExpanded = expandedExercise === exercise.name;
                        const isDeleteMode = deleteConfirm === exercise.name;

                        return (
                            <View
                                key={exercise.name}
                                style={styles.exerciseCardRow}
                            >
                                <Pressable
                                    onPress={() => setExpandedExercise(isExpanded ? null : exercise.name)}
                                    style={{ flex: 1 }}
                                >
                                    <Text style={styles.title}>{exercise.name}</Text>
                                    {isExpanded && (
                                        <View style={styles.details}>
                                            <Text style={styles.detailText}>
                                                PR: {
                                                    exerciseStats[exercise.name]?.pr
                                                        ? exercise.type === 'Rep'
                                                            ? `${(exerciseStats[exercise.name].pr as any).weight ?? ''}kg x ${(exerciseStats[exercise.name].pr as any).reps ?? ''}`
                                                            : exercise.type === 'Time'
                                                                ? `${(exerciseStats[exercise.name].pr as any).time ?? ''} sec`
                                                                : exercise.type === 'Distance'
                                                                    ? `${(exerciseStats[exercise.name].pr as any).distance ?? ''}km${(exerciseStats[exercise.name].pr as any).distance !== undefined ? ` in ${(exerciseStats[exercise.name].pr as any).time ?? ''}min` : ''}`
                                                                    : exercise.type === 'Calisthenics'
                                                                        ? `${(exerciseStats[exercise.name].pr as any).reps ?? ''} reps`
                                                                        : '—'
                                                        : '—'
                                                }
                                            </Text>
                                            <Text style={styles.detailText}>
                                                Times Trained: {exerciseStats[exercise.name]?.timesTrained ?? 0}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                                <View style={styles.exerciseCardButtons}>
                                    {!isDeleteMode ? (
                                        <>
                                            <TouchableOpacity
                                                style={styles.iconButton}
                                                onPress={() => handleInfoPress(exercise)}
                                                accessibilityLabel={`Info about ${exercise.name}`}
                                            >
                                                <MaterialCommunityIcons name="information" size={22} color="#1976d2" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.iconButton}
                                                onPress={() => setDeleteConfirm(exercise.name)}
                                                accessibilityLabel={`Delete ${exercise.name}`}
                                            >
                                                <Ionicons name="trash-outline" size={22} color="#b71c1c" />
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteExercise(exercise.name)}
                                                style={styles.confirmButton}
                                                accessibilityLabel="Confirm delete"
                                            >
                                                <MaterialCommunityIcons name="check-circle-outline" size={24} color="#388e3c" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setDeleteConfirm(null)}
                                                style={styles.cancelButton}
                                                accessibilityLabel="Cancel delete"
                                            >
                                                <MaterialCommunityIcons name="close-circle-outline" size={24} color="#b71c1c" />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>
                        );
                    })}
            </ScrollView>

			{/* Add Exercise Modal */}
			<Modal
				visible={showModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowModal(false)}
			>
				<View style={styles.confirmOverlay}>
					<View style={styles.confirmContainerLeft}>
						<Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, alignSelf: 'flex-start' }}>Add Exercise</Text>
						<TextInput
							style={[styles.input, { alignSelf: 'stretch' }]}
							placeholder="Exercise Name"
							value={newName}
							onChangeText={setNewName}
						/>
						<Text style={styles.categoryLabel}>Exercise category:</Text>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 }}>
							{typeOptions.map(opt => (
								<TouchableOpacity
									key={opt.value}
									style={[
										styles.typeOption,
										newType === opt.value && styles.typeOptionSelected,
									]}
									onPress={() => setNewType(opt.value as any)}
								>
									<Text style={[
										styles.typeOptionText,
										newType === opt.value && styles.typeOptionTextSelected,
									]}>{opt.label}</Text>
								</TouchableOpacity>
							))}
						</View>
						{/* Type Description */}
						{newType === 'Rep' && (
							<Text style={styles.typeDescription}>
								Exercise with weight and repetitions. Example: bench presses, deadlifts or squats...
							</Text>
						)}
						{newType === 'Time' && (
							<Text style={styles.typeDescription}>
								Time-based exercises. Example: abb plank
							</Text>
						)}
						{newType === 'Distance' && (
							<Text style={styles.typeDescription}>
								Exercises based on time and distance. Example: running or cycling...
							</Text>
						)}
                        {newType === 'Calisthenics' && (
							<Text style={styles.typeDescription}>
								Exercises based on repetitions with bodyweight. Example: pullups or pushups...
							</Text>
						)}
						<View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: 12,
                                alignSelf: 'stretch',
                            }}
                        >
                            <Pressable
                                style={styles.closeButton}
                                onPress={() => {
                                    setShowModal(false);
                                    setNewName('');
                                    setNewType('Rep');
                                }}
                                disabled={isSaving}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.closeButton,
                                    (!newName.trim() || isSaving) && { opacity: 0.5 },
                                ]}
                                onPress={handleAddExercise}
                                disabled={!newName.trim() || isSaving}
                            >
                                <Text style={styles.confirmButtonText}>Add</Text>
                            </Pressable>
                        </View>
					</View>
				</View>
			</Modal>

			{/* Info Modal */}
			{infoModal.visible && infoModal.exercise && (
                <Modal
                    visible={infoModal.visible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setInfoModal({ visible: false, exercise: null })}
                >
                    <View style={styles.confirmOverlay}>
                        <View style={[styles.confirmContainerLeft, { width: '90%' }]}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                                {infoModal.exercise.type === 'Rep'
                                    ? `One rep max progress for ${infoModal.exercise.name}`
                                    : infoModal.exercise.type === 'Calisthenics'
                                        ? `Repetitions progress for ${infoModal.exercise.name}`
                                        : `Results for ${infoModal.exercise.name}`}
                            </Text>
                            {infoModal.exercise.type === 'Rep' ? (
                                oneRmData.length === 0 ? (
                                    <Text>No data available for this exercise.</Text>
                                ) : (
                                    <>
                                        {/* Zoom Controls */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: '#eee', marginHorizontal: 4 }]}
                                                onPress={() => handleZoom('out')}
                                                disabled={zoomStage === 1}
                                            >
                                                <Text style={{ fontSize: 18 }}>－</Text>
                                            </Pressable>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: '#eee', marginHorizontal: 4 }]}
                                                onPress={() => handleZoom('in')}
                                                disabled={zoomStage === 5}
                                            >
                                                <Text style={{ fontSize: 18 }}>＋</Text>
                                            </Pressable>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: '#eee', marginHorizontal: 4 }]}
                                                onPress={() => handlePan('left')}
                                                disabled={zoomWindow.start === 0}
                                            >
                                                <Text style={{ fontSize: 18 }}>{'←'}</Text>
                                            </Pressable>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: '#eee', marginHorizontal: 4 }]}
                                                onPress={() => handlePan('right')}
                                                disabled={zoomWindow.end === oneRmData.length}
                                            >
                                                <Text style={{ fontSize: 18 }}>{'→'}</Text>
                                            </Pressable>
                                        </View>
                                        <View>
                                            <LineChart
                                                data={{
                                                    labels: getXAxisLabels(
                                                        oneRmData.slice(zoomWindow.start, zoomWindow.end),
                                                        zoomStages[zoomStage - 1].label
                                                    ),
                                                    datasets: [{
                                                        data: oneRmData
                                                            .slice(zoomWindow.start, zoomWindow.end)
                                                            .map(d => d.oneRm !== null ? d.oneRm : 0),
                                                    }]
                                                }}
                                                width={Dimensions.get('window').width * 0.8}
                                                height={200}
                                                chartConfig={{
                                                    backgroundColor: '#fff',
                                                    backgroundGradientFrom: '#fff',
                                                    backgroundGradientTo: '#fff',
                                                    color: (opacity = 1) => `rgba(183, 28, 28, ${opacity})`,
                                                    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                                                }}
                                                bezier
                                                style={{ borderRadius: 8 }}
                                                fromZero={true}
                                                withDots={true}
                                                withShadow={false}
                                            />
                                        </View>
                                    </>
                                )
                            ) : infoModal.exercise.type === 'Calisthenics' ? (
                                oneRmData.length === 0 ? (
                                    <Text>No data available for this exercise.</Text>
                                ) : (
                                    <>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: '#eee', marginHorizontal: 4 }]}
                                                onPress={() => handleZoom('out')}
                                                disabled={zoomStage === 1}
                                            >
                                                <Text style={{ fontSize: 18 }}>－</Text>
                                            </Pressable>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: '#eee', marginHorizontal: 4 }]}
                                                onPress={() => handleZoom('in')}
                                                disabled={zoomStage === 5}
                                            >
                                                <Text style={{ fontSize: 18 }}>＋</Text>
                                            </Pressable>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: '#eee', marginHorizontal: 4 }]}
                                                onPress={() => handlePan('left')}
                                                disabled={zoomWindow.start === 0}
                                            >
                                                <Text style={{ fontSize: 18 }}>{'←'}</Text>
                                            </Pressable>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: '#eee', marginHorizontal: 4 }]}
                                                onPress={() => handlePan('right')}
                                                disabled={zoomWindow.end === oneRmData.length}
                                            >
                                                <Text style={{ fontSize: 18 }}>{'→'}</Text>
                                            </Pressable>
                                        </View>
                                        <View>
                                            <LineChart
                                                data={{
                                                    labels: getXAxisLabels(
                                                        oneRmData.slice(zoomWindow.start, zoomWindow.end),
                                                        zoomStages[zoomStage - 1].label
                                                    ),
                                                    datasets: [
                                                        {
                                                            data: oneRmData
                                                                .slice(zoomWindow.start, zoomWindow.end)
                                                                .map(d => d.reps ?? 0),
                                                            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                                                            strokeWidth: 2,
                                                        },
                                                        // If any time data present, show as second line
                                                        ...(oneRmData.some(d => d.time !== undefined && d.time > 0)
                                                            ? [{
                                                                data: oneRmData
                                                                    .slice(zoomWindow.start, zoomWindow.end)
                                                                    .map(d => d.time ?? 0),
                                                                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                                                                strokeWidth: 2,
                                                            }]
                                                            : []
                                                        ),
                                                    ],
                                                    legend: oneRmData.some(d => d.time !== undefined && d.time > 0)
                                                        ? ['Reps', 'Time (s)']
                                                        : ['Reps'],
                                                }}
                                                width={Dimensions.get('window').width * 0.8}
                                                height={200}
                                                chartConfig={{
                                                    backgroundColor: '#fff',
                                                    backgroundGradientFrom: '#fff',
                                                    backgroundGradientTo: '#fff',
                                                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                                                    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                                                }}
                                                bezier
                                                style={{ borderRadius: 8 }}
                                                fromZero={true}
                                                withDots={true}
                                                withShadow={false}
                                            />
                                        </View>
                                    </>
                                )
                            ) : (
                                exerciseResults.length === 0 ? (
                                    <Text>No data available for this exercise.</Text>
                                ) : (
                                    <ScrollView style={{ maxHeight: 220, width: '100%' }}>
                                        {exerciseResults.map((res, idx) => (
                                            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <Text style={{ fontSize: 16 }}>{res.value}</Text>
                                                <Text style={{ fontSize: 14, color: '#888' }}>{res.date}</Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )
                            )}
                            <Pressable
                                style={styles.closeButton}
                                onPress={() => setInfoModal({ visible: false, exercise: null })}
                            >
                                <Text style={styles.cancelButtonText}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            )}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#e0e0e0', // light grey background
	},
	categoryLabel: {
		fontSize: 16,
		fontWeight: '600',
		marginTop: 20,
		marginLeft: 0,
		marginBottom: 0,
		color: '#444',
	},
	categoryContainer: {
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
		backgroundColor: '#e0e0e0',
	},
	categoryRow: {
		gap: 8,
	},
	categoryButton: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 20,
		paddingVertical: 6,
		paddingHorizontal: 14,
		backgroundColor: '#fff',
	},
	categoryButtonActive: {
		borderColor: 'red',
		backgroundColor: '#ffd6d6', // light red background
	},
	categoryButtonText: {
		fontSize: 16,
		color: '#444',
	},
	categoryButtonTextActive: {
		color: 'red',
		fontWeight: '600',
	},
	scrollContent: {
		padding: 16,
	},
	header: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	exerciseCard: {
		backgroundColor: '#f4f4f4',
		padding: 16,
		borderRadius: 10,
		marginBottom: 12,
	},
	exerciseCardRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f4f4f4',
		padding: 16,
		borderRadius: 10,
		marginBottom: 12,
	},
	exerciseCardButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginLeft: 12,
	},
	iconButton: {
		padding: 4,
		marginLeft: 8,
		borderRadius: 20,
		backgroundColor: 'transparent',
	},
	details: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: '#ccc',
	},
	detailText: {
		fontSize: 16,
		color: '#666',
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: 'transparent', // match WorkoutsScreen
	},
	modalContent: {
		marginHorizontal: 20,
		maxHeight: '70%',
		minHeight: '40%',
		backgroundColor: '#fff',
		borderRadius: 10,
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 10,
		elevation: 5,
		justifyContent: 'space-between',
		width: '80%',
		alignSelf: 'center',
	},
	input: {
		borderRadius: 6,
		padding: 12,
		marginBottom: 12,
		fontSize: 18,
		backgroundColor: 'white',
		color: 'black',
		fontWeight: 'bold',
		borderWidth: 1,
		borderColor: '#ccc',
	},
	addButton: {
        backgroundColor: '#b71c1c',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
    },
	cancelButton: {
		backgroundColor: '#f4f4f4',
		padding: 4,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 4,
	},
    closeButton: {
		backgroundColor: '#b71c1c',
		padding: 4,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 4,
	},
	cancelButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	confirmButton: {
        backgroundColor: '#f4f4f4',
        padding: 4,
        borderRadius: 6,
		marginLeft: 8,
	},
	confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
	},
	typeOption: {
		flex: 1,
		padding: 12,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#f9f9f9',
	},
	typeOptionSelected: {
		borderColor: 'red',
		backgroundColor: '#ffd6d6',
	},
	typeOptionText: {
		fontSize: 16,
		color: '#444',
	},
	typeOptionTextSelected: {
		color: 'red',
		fontWeight: '600',
	},
	typeDescription: {
		fontSize: 14,
		color: '#666',
		marginBottom: 4,
		marginTop: -4,
	},
	confirmOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(57, 57, 57, 0.51)', // match WorkoutsScreen
    },
    confirmContainerLeft: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        alignItems: 'flex-start', // left align content
        width: '80%',
        alignSelf: 'center',
    },
    title: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
});
