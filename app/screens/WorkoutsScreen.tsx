import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Exercise, ExerciseCategory } from '../models/Exercise';
import { loadExercises } from '../storage/exerciseStorage';
import { addWorkout, DEFAULT_WORKOUT_NAMES, loadWorkouts, updateWorkout } from '../storage/workoutStorage'; // update import

export default function ExercisesScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutName, setWorkoutName] = useState('');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
    const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

    // New state for added exercises to the new workout
    const [addedExercises, setAddedExercises] = useState<{ name: string; sets: string }[]>([]);
    const [addExerciseBoxVisible, setAddExerciseBoxVisible] = useState(false);

    // For focusing the sets input after adding an exercise
    const setsInputRefs = useRef<{ [key: number]: any }>({});

    const navigation = useNavigation();

    // Track workouts locally
    const [workouts, setWorkouts] = useState<Workout[]>([]);

    // Edit workout state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editWorkoutIdx, setEditWorkoutIdx] = useState<number | null>(null);
    const [editWorkoutName, setEditWorkoutName] = useState('');
    const [editAddedExercises, setEditAddedExercises] = useState<{ name: string; sets: string }[]>([]);

    // Edit modal exercise add states
    const [editAddExerciseBoxVisible, setEditAddExerciseBoxVisible] = useState(false);
    const [editSelectedCategory, setEditSelectedCategory] = useState<ExerciseCategory | null>(null);
    const [editSelectedExercise, setEditSelectedExercise] = useState<string | null>(null);

    // For delete confirm in add/edit exercise list
    const [deleteExerciseIdx, setDeleteExerciseIdx] = useState<number | null>(null);
    const [editDeleteExerciseIdx, setEditDeleteExerciseIdx] = useState<number | null>(null);

    // Change these states:
    const [deleteExerciseName, setDeleteExerciseName] = useState<string | null>(null);
    const [editDeleteExerciseName, setEditDeleteExerciseName] = useState<string | null>(null);

    // Replace this:
    // useEffect(() => {
    //     loadExercises().then(setExercises);
    // }, []);

    // With this:
    useFocusEffect(
        React.useCallback(() => {
            loadExercises().then(setExercises);
        }, [])
    );

    useEffect(() => {
        // Load workouts from storage on mount
        loadWorkouts().then(loaded => {
            if (loaded.length > 0) {
                setWorkouts(loaded);
            } else {
                setWorkouts(DEFAULT_WORKOUT_NAMES);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            setFilteredExercises(exercises.filter(e => e.category === selectedCategory));
        } else {
            setFilteredExercises([]);
        }
    }, [selectedCategory, exercises]);

    // When user selects an exercise from dropdown
    const handleSelectExercise = (exerciseName: string) => {
        setAddedExercises(prev => [...prev, { name: exerciseName, sets: '3' }]);
        setAddExerciseBoxVisible(false);
        setSelectedCategory(null);
        setSelectedExercise(null);
        // Focus the sets input for the last added exercise
        setTimeout(() => {
            const idx = addedExercises.length;
            setsInputRefs.current[idx]?.focus();
        }, 100);
    };

    // Handle sets input change
    const handleSetsChange = (exerciseName: string, value: string) => {
        setAddedExercises(prev =>
            prev.map(ex => ex.name === exerciseName ? { ...ex, sets: value.replace(/[^0-9]/g, '') } : ex)
        );
    };

    // Update handleAddWorkout logic:
    const handleAddWorkout = async () => {
        if (!workoutName.trim() || addedExercises.length === 0) return;

        // Build the exercises array with correct number of sets
        const exercisesArr: string[] = [];
        addedExercises.forEach(ex => {
            for (let i = 0; i < Number(ex.sets); i++) {
                exercisesArr.push(ex.name);
            }
        });

        const newWorkout = {
            name: workoutName.trim(),
            exercises: exercisesArr,
        };

        // Add to persistent storage
        await addWorkout(newWorkout);

        // Update local state
        setWorkouts(prev => [...prev, newWorkout]);

        // Reset modal state
        setWorkoutName('');
        setAddedExercises([]);
        setAddExerciseBoxVisible(false);
        setSelectedCategory(null);
        setSelectedExercise(null);
        setModalVisible(false);
    };

    const handleCancelAddWorkout = () => {
        setWorkoutName('');
        setAddedExercises([]);
        setAddExerciseBoxVisible(false);
        setSelectedCategory(null);
        setSelectedExercise(null);
        setModalVisible(false);
    };

    const handleCardPress = (idx: number) => {
        setExpandedIndex(expandedIndex === idx ? null : idx);
    };

    const handleStartPress = (workoutName: string) => {
        setSelectedWorkout(workoutName);
        setConfirmVisible(true);
    };

    const handleConfirm = async () => {
        setConfirmVisible(false);
        if (!selectedWorkout) return;

        // Find the selected workout
        const workout = workouts.find(w => w.name === selectedWorkout);
        if (!workout) return;

        // Navigate to MyWorkoutScreen and pass the workout name
        navigation.navigate('MyWorkout', { workoutName: selectedWorkout });
    };

    // Open edit modal with selected workout data
    const handleEditWorkout = (idx: number) => {
        const workout = workouts[idx];
        setEditWorkoutIdx(idx);
        setEditWorkoutName(workout.name);
        // Convert exercises array to [{name, sets}] format
        const exCount: Record<string, number> = {};
        workout.exercises.forEach(ex => { exCount[ex] = (exCount[ex] || 0) + 1; });
        setEditAddedExercises(Object.entries(exCount).map(([name, sets]) => ({ name, sets: sets.toString() })));
        setEditModalVisible(true);
    };

    // Save edited workout
    const handleSaveEditWorkout = async () => {
        if (editWorkoutIdx === null || !editWorkoutName.trim() || editAddedExercises.length === 0) return;
        // Build exercises array
        const exercisesArr: string[] = [];
        editAddedExercises.forEach(ex => {
            for (let i = 0; i < Number(ex.sets); i++) {
                exercisesArr.push(ex.name);
            }
        });
        const updatedWorkout = { name: editWorkoutName.trim(), exercises: exercisesArr };
        // Update in persistent storage
        await updateWorkout(editWorkoutIdx, updatedWorkout); // <-- persist change
        const updatedWorkouts = workouts.map((w, i) => i === editWorkoutIdx ? updatedWorkout : w);
        setWorkouts(updatedWorkouts);
        setEditModalVisible(false);
        setEditWorkoutIdx(null);
        setEditWorkoutName('');
        setEditAddedExercises([]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workouts</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Add Workout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView>
                {workouts.map((workout, idx) => (
                    <View key={workout.name} style={styles.card}>
                        <View style={styles.cardRow}>
                            <TouchableOpacity onPress={() => handleCardPress(idx)} style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{workout.name}</Text>
                            </TouchableOpacity>
                            {/* Pencil (edit) button */}
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEditWorkout(idx)}
                                accessibilityLabel={`Edit ${workout.name}`}
                            >
                                <MaterialCommunityIcons name="pencil" size={22} color="#1976d2" />
                            </TouchableOpacity>
                            {/* Start button, smaller, triangle only, red, no background */}
                            <TouchableOpacity
                                style={styles.startButtonNoBg}
                                onPress={() => handleStartPress(workout.name)}
                            >
                                <Ionicons name="play" size={22} color="#b71c1c" />
                            </TouchableOpacity>
                        </View>
                        {expandedIndex === idx && (
                            <View style={styles.exerciseList}>
                                {Object.entries(
                                    workout.exercises.reduce((acc, ex) => {
                                        acc[ex] = (acc[ex] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>)
                                ).map(([ex, count]) => (
                                    <Text key={ex} style={styles.exerciseText}>
                                        - {ex} x {count}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Add Workout Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView contentContainerStyle={styles.modalScrollContent}>
                            <TextInput
                                placeholder="Workout name..."
                                value={workoutName}
                                onChangeText={setWorkoutName}
                                style={styles.workoutNameInput}
                                placeholderTextColor="#888"
                            />
                            {/* Render added exercises as cards */}
                            <DraggableFlatList
                                data={addedExercises}
                                keyExtractor={(item, index) => item.name + index}
                                onDragEnd={({ data }) => setAddedExercises(data)}
                                renderItem={({ item, index, drag, isActive }) => {
                                    const isDeleteMode = deleteExerciseName === item.name;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.exerciseCard,
                                                isActive && { backgroundColor: '#eee' }
                                            ]}
                                            onLongPress={drag}
                                            delayLongPress={100}
                                            activeOpacity={1}
                                        >
                                            <Text style={styles.exerciseCardText}>{item.name}</Text>
                                            <View style={styles.setsRow}>
                                                <Text style={styles.setsLabel}>Sets:</Text>
                                                <TextInput
                                                    ref={ref => (setsInputRefs.current[item.name] = ref)}
                                                    style={styles.setsInput}
                                                    keyboardType="number-pad"
                                                    value={item.sets}
                                                    onChangeText={val => handleSetsChange(item.name, val)}
                                                />
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                                {!isDeleteMode ? (
                                                    <TouchableOpacity
                                                        style={styles.iconButton}
                                                        onPress={() => setDeleteExerciseName(item.name)}
                                                        accessibilityLabel={`Delete ${item.name}`}
                                                    >
                                                        <Ionicons name="trash-outline" size={22} color="#b71c1c" />
                                                    </TouchableOpacity>
                                                ) : (
                                                    <>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                // Remove only the first occurrence with this name
                                                                setAddedExercises(prev => {
                                                                    const idx = prev.findIndex(ex => ex.name === item.name);
                                                                    if (idx === -1) return prev;
                                                                    return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
                                                                });
                                                                setDeleteExerciseName(null);
                                                            }}
                                                            style={styles.confirmButton}
                                                            accessibilityLabel="Confirm delete"
                                                        >
                                                            <MaterialCommunityIcons name="check-circle-outline" size={24} color="#388e3c" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => setDeleteExerciseName(null)}
                                                            style={styles.cancelButton}
                                                            accessibilityLabel="Cancel delete"
                                                        >
                                                            <MaterialCommunityIcons name="close-circle-outline" size={24} color="#b71c1c" />
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                scrollEnabled={false}
                                style={{ marginBottom: 12 }}
                            />
                            {/* Add Exercise Button or Dropdown */}
                            {!addExerciseBoxVisible && (
                                <TouchableOpacity
                                    style={styles.addExerciseButton}
                                    onPress={() => setAddExerciseBoxVisible(true)}
                                >
                                    <Text style={styles.addExerciseButtonText}>+ Add exercise</Text>
                                </TouchableOpacity>
                            )}
                            {addExerciseBoxVisible && (
                                <View style={styles.addExerciseBox}>
                                    <Text style={styles.dropdownLabel}>Category</Text>
                                    <View style={styles.dropdown}>
                                        {(['Back', 'Chest', 'Legs', 'Shoulders', 'Triceps', 'Biceps', 'Cardio', 'Abs'] as ExerciseCategory[]).map(cat => (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[
                                                    styles.dropdownItem,
                                                    selectedCategory === cat && styles.dropdownItemSelected
                                                ]}
                                                onPress={() => {
                                                    setSelectedCategory(cat);
                                                    setSelectedExercise(null);
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {selectedCategory && (
                                        <>
                                            <Text style={styles.dropdownLabel}>Exercise</Text>
                                            <View style={styles.dropdown}>
                                                {filteredExercises.map(ex => {
                                                    const alreadyAdded = addedExercises.some(ae => ae.name === ex.name);
                                                    return (
                                                        <TouchableOpacity
                                                            key={ex.name}
                                                            style={[
                                                                styles.dropdownItem,
                                                                selectedExercise === ex.name && styles.dropdownItemSelected,
                                                                alreadyAdded && { opacity: 0.4 }
                                                            ]}
                                                            onPress={() => !alreadyAdded && handleSelectExercise(ex.name)}
                                                            disabled={alreadyAdded}
                                                        >
                                                            <Text style={styles.dropdownItemText}>{ex.name}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={handleCancelAddWorkout}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    (!workoutName.trim() || addedExercises.length === 0) && { opacity: 0.5 }
                                ]}
                                onPress={handleAddWorkout}
                                disabled={!workoutName.trim() || addedExercises.length === 0}
                            >
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Workout Modal */}
            <Modal visible={editModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView contentContainerStyle={styles.modalScrollContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                <TextInput
                                    placeholder="Workout name..."
                                    value={editWorkoutName}
                                    onChangeText={setEditWorkoutName}
                                    style={[styles.workoutNameInput, { flex: 1, marginBottom: 0 }]}
                                    placeholderTextColor="#888"
                                />
                                <TouchableOpacity
                                    style={[styles.iconButton, { marginLeft: 8 }]}
                                    onPress={() => {
                                        setEditModalVisible(false); // Hide edit modal
                                        setTimeout(() => setDeleteConfirmVisible(true), 200); // Show delete modal after a short delay
                                    }}
                                    accessibilityLabel="Delete workout"
                                >
                                    <Ionicons name="trash-outline" size={24} color="#b71c1c" />
                                </TouchableOpacity>
                            </View>
                            {/* Render added exercises as cards */}
                            <DraggableFlatList
                                data={editAddedExercises}
                                keyExtractor={(item, index) => item.name + index}
                                onDragEnd={({ data }) => setEditAddedExercises(data)}
                                renderItem={({ item, index, drag, isActive }: RenderItemParams<{ name: string; sets: string }>) => {
                                    const isDeleteMode = editDeleteExerciseName === item.name;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.exerciseCard,
                                                isActive && { backgroundColor: '#eee' }
                                            ]}
                                            onLongPress={drag}
                                            delayLongPress={100}
                                            activeOpacity={1}
                                        >
                                            <Text style={styles.exerciseCardText}>{item.name}</Text>
                                            <View style={styles.setsRow}>
                                                <Text style={styles.setsLabel}>Sets:</Text>
                                                <TextInput
                                                    style={styles.setsInput}
                                                    keyboardType="number-pad"
                                                    value={item.sets}
                                                    onChangeText={val => setEditAddedExercises(prev =>
                                                        prev.map(ex => ex.name === item.name ? { ...ex, sets: val.replace(/[^0-9]/g, '') } : ex)
                                                    )}
                                                />
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                                {!isDeleteMode ? (
                                                    <TouchableOpacity
                                                        style={styles.iconButton}
                                                        onPress={() => setEditDeleteExerciseName(item.name)}
                                                        accessibilityLabel={`Delete ${item.name}`}
                                                    >
                                                        <Ionicons name="trash-outline" size={22} color="#b71c1c" />
                                                    </TouchableOpacity>
                                                ) : (
                                                    <>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setEditAddedExercises(prev => {
                                                                    const idx = prev.findIndex(ex => ex.name === item.name);
                                                                    if (idx === -1) return prev;
                                                                    return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
                                                                });
                                                                setEditDeleteExerciseName(null);
                                                            }}
                                                            style={styles.confirmButton}
                                                            accessibilityLabel="Confirm delete"
                                                        >
                                                            <MaterialCommunityIcons name="check-circle-outline" size={24} color="#388e3c" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => setEditDeleteExerciseName(null)}
                                                            style={styles.cancelButton}
                                                            accessibilityLabel="Cancel delete"
                                                        >
                                                            <MaterialCommunityIcons name="close-circle-outline" size={24} color="#b71c1c" />
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                scrollEnabled={false}
                                style={{ marginBottom: 12 }}
                            />
                            {/* Add Exercise Button or Dropdown for Edit Modal */}
                            {!editAddExerciseBoxVisible && (
                                <TouchableOpacity
                                    style={styles.addExerciseButton}
                                    onPress={() => setEditAddExerciseBoxVisible(true)}
                                >
                                    <Text style={styles.addExerciseButtonText}>+ Add exercise</Text>
                                </TouchableOpacity>
                            )}
                            {editAddExerciseBoxVisible && (
                                <View style={styles.addExerciseBox}>
                                    <Text style={styles.dropdownLabel}>Category</Text>
                                    <View style={styles.dropdown}>
                                        {(['Back', 'Chest', 'Legs', 'Shoulders', 'Triceps', 'Biceps', 'Cardio', 'Abs'] as ExerciseCategory[]).map(cat => (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[
                                                    styles.dropdownItem,
                                                    editSelectedCategory === cat && styles.dropdownItemSelected
                                                ]}
                                                onPress={() => {
                                                    setEditSelectedCategory(cat);
                                                    setEditSelectedExercise(null);
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {editSelectedCategory && (
                                        <>
                                            <Text style={styles.dropdownLabel}>Exercise</Text>
                                            <View style={styles.dropdown}>
                                                {exercises.filter(e => e.category === editSelectedCategory).map(ex => {
                                                    const alreadyAdded = editAddedExercises.some(ae => ae.name === ex.name);
                                                    return (
                                                        <TouchableOpacity
                                                            key={ex.name}
                                                            style={[
                                                                styles.dropdownItem,
                                                                editSelectedExercise === ex.name && styles.dropdownItemSelected,
                                                                alreadyAdded && { opacity: 0.4 }
                                                            ]}
                                                            onPress={() => {
                                                                if (!alreadyAdded) {
                                                                    setEditAddedExercises(prev => [...prev, { name: ex.name, sets: '3' }]);
                                                                    setEditAddExerciseBoxVisible(false);
                                                                    setEditSelectedCategory(null);
                                                                    setEditSelectedExercise(null);
                                                                }
                                                            }}
                                                            disabled={alreadyAdded}
                                                        >
                                                            <Text style={styles.dropdownItemText}>{ex.name}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => {
                                setEditModalVisible(false);
                                setEditAddExerciseBoxVisible(false); // <-- close add exercise box
                                setEditSelectedCategory(null);       // <-- reset category
                                setEditSelectedExercise(null);       // <-- reset exercise
                            }}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    (!editWorkoutName.trim() || editAddedExercises.length === 0) && { opacity: 0.5 }
                                ]}
                                onPress={handleSaveEditWorkout}
                                disabled={!editWorkoutName.trim() || editAddedExercises.length === 0}
                            >
                                <Text style={styles.modalButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirm Start Modal */}
            <Modal visible={confirmVisible} transparent={true} animationType="fade">
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmContainer}>
                        <Text style={styles.confirmText}>Sure?</Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                                onPress={() => setConfirmVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#b71c1c' }]}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.modalButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal
                visible={deleteConfirmVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteConfirmVisible(false)}
            >
                <View style={styles.confirmOverlay}>
                    <View style={[styles.confirmContainer, { alignItems: 'flex-start', width: '80%' }]}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Delete workout</Text>
                        <Text style={{ fontSize: 16, marginBottom: 20 }}>
                            Are you sure you want to delete this workout?
                        </Text>
                        <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#ccc', marginRight: 8 }]}
                                onPress={() => {
                                    setDeleteConfirmVisible(false);
                                    setTimeout(() => setEditModalVisible(true), 200); // Reopen edit modal
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#b71c1c' }]}
                                onPress={async () => {
                                    if (editWorkoutIdx !== null) {
                                        const updated = workouts.filter((_, i) => i !== editWorkoutIdx);
                                        await (await import('../storage/workoutStorage')).saveWorkout(updated);
                                        setWorkouts(updated);
                                    }
                                    setDeleteConfirmVisible(false);
                                    setEditModalVisible(false);
                                    setEditWorkoutIdx(null);
                                    setEditWorkoutName('');
                                    setEditAddedExercises([]);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 76,
        paddingHorizontal: 20,
        backgroundColor: '#e0e0e0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    modalContainer: {
        marginHorizontal: 20,
        maxHeight: '70%',
        minHeight: '70%',
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        elevation: 5,
        justifyContent: 'space-between',
    },
    modalScrollContent: {
        paddingBottom: 10,
    },
    workoutNameInput: {
        borderRadius: 6,
        padding: 12,
        marginBottom: 20,
        fontSize: 22, // match the previous modalTitle font size
        backgroundColor: 'white',
        color: 'black',
        fontWeight: 'bold',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderColor: '#ccc',
    },
    modalButton: {
        backgroundColor: '#b71c1c',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: 'black',
    },
    startButton: {
        backgroundColor: '#b71c1c',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    startButtonNoBg: {
        // New style for the smaller, no-background start button
        padding: 6,
        borderRadius: 20,
        marginLeft: 8,
    },
    exerciseList: {
        marginTop: 10,
        paddingLeft: 10,
    },
    exerciseText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    confirmOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(57, 57, 57, 0.51)',
    },
    confirmContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        width: 700, // Reduced width for "Sure?" popup
        maxWidth: '80%',
    },
    confirmText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    confirmButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    addExerciseButton: {
        backgroundColor: '#222',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    addExerciseButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addExerciseBox: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    dropdownLabel: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
        marginTop: 8,
    },
    dropdown: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    dropdownItem: {
        backgroundColor: '#eee',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 8,
        marginBottom: 8,
    },
    dropdownItemSelected: {
        backgroundColor: '#b71c1c',
    },
    dropdownItemText: {
        color: '#222',
        fontSize: 15,
        fontWeight: 'bold',
    },
    exerciseCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    exerciseCardText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#222',
        flex: 1,
    },
    setsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    setsLabel: {
        fontSize: 15,
        marginRight: 4,
        color: '#444',
    },
    setsInput: {
        width: 40,
        height: 32,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        textAlign: 'center',
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        color: '#222',
        fontWeight: 'bold',
        padding: 0,
    },
    confirmButton: {
        marginLeft: 8,
        padding: 4,
    },
    cancelButton: {
        marginLeft: 4,
        padding: 4,
    },
    editButton: {
        marginLeft: 12,
        padding: 4,
    },
    iconButton: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
});


