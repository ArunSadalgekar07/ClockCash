import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';

// Constants
const INSPIRATIONAL_QUOTES = [
  "Time is money, but money isn't everything.",
  "Small steps lead to big achievements.",
  "Your future is created by what you do today.",
  "Productivity is never an accident.",
  "Focus on progress, not perfection.",
  "Every minute spent planning saves hours in execution.",
  "The only way to do great work is to love what you do.",
  "Your time is limited, don't waste it.",
  "Success is built one focused session at a time.",
  "The best investment you can make is in yourself.",
];

const REWARD_RATES = {
  ONE_HOUR: { duration: 3600, reward: 250 },
  TWO_HOURS: { duration: 7200, reward: 500 },
  THREE_HOURS: { duration: 10800, reward: 750 },
};

export default function App() {
  // State Management
  const [showSplash, setShowSplash] = useState(true);
  const [taskName, setTaskName] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earned, setEarned] = useState(0);
  const [totalMoney, setTotalMoney] = useState(0);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const timerRef = useRef(null);

  // Persistence Functions
  const saveMoneyToStorage = async (amount) => {
    try {
      await AsyncStorage.setItem('@total_money', amount.toString());
    } catch (error) {
      console.error('Error saving money:', error);
    }
  };

  const loadMoneyFromStorage = async () => {
    try {
      const savedMoney = await AsyncStorage.getItem('@total_money');
      if (savedMoney !== null) {
        setTotalMoney(parseInt(savedMoney));
      }
    } catch (error) {
      console.error('Error loading money:', error);
    }
  };

  // Timer Functions
  const startTimer = (duration) => {
    setSelectedDuration(duration);
    setTimeLeft(duration);
    setIsRunning(true);
  };

  const startCustomTimer = () => {
    const minutes = parseFloat(customMinutes);
    if (!isNaN(minutes) && minutes > 0) {
      const durationInSeconds = Math.floor(minutes * 60);
      startTimer(durationInSeconds);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
  };

  const resumeTimer = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  };

  const exitSession = () => {
    if (isRunning) {
      clearInterval(timerRef.current);
    }
    setSelectedDuration(null);
    setTimeLeft(0);
    setIsRunning(false);
    setTaskName('');
    setCustomMinutes('');
  };

  // Utility Functions
  const formatTime = (sec) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  };

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
    return INSPIRATIONAL_QUOTES[randomIndex];
  };

  const calculateReward = (duration) => {
    if (duration === REWARD_RATES.ONE_HOUR.duration) return REWARD_RATES.ONE_HOUR.reward;
    if (duration === REWARD_RATES.TWO_HOURS.duration) return REWARD_RATES.TWO_HOURS.reward;
    if (duration === REWARD_RATES.THREE_HOURS.duration) return REWARD_RATES.THREE_HOURS.reward;
    return Math.floor((duration / 3600) * 250); // Custom duration reward
  };

  // Event Handlers
  const closeCelebration = () => {
    setShowConfetti(false);
    const newTotal = totalMoney + earned;
    setShowCelebration(false);
    setTotalMoney(newTotal);
    saveMoneyToStorage(newTotal);
    setTaskName('');
    setSelectedDuration(null);
    setTimeLeft(0);
    setEarned(0);
    setCustomMinutes('');
  };

  // Effects
  useEffect(() => {
    // Load saved money on app start
    loadMoneyFromStorage();
  }, []);

  useEffect(() => {
    // Splash screen timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Timer countdown logic
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      clearInterval(timerRef.current);
      setShowConfetti(true); // Show confetti first
      setIsRunning(false);
      const moneyEarned = calculateReward(selectedDuration);
      setEarned(moneyEarned);
      setShowCelebration(true);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft, selectedDuration]);

  // Render Functions
  const renderSplashScreen = () => (
    <View style={styles.splashContainer}>
      <Text style={styles.logoText}>My Productivity App</Text>
    </View>
  );

  const renderTimerControls = () => (
    <View style={styles.controls}>
      <TouchableOpacity 
        style={[styles.controlButton, isRunning ? styles.pauseButton : styles.resumeButton]} 
        onPress={isRunning ? pauseTimer : resumeTimer}
        disabled={!isRunning && timeLeft === 0}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Pause' : 'Resume'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.controlButton, styles.exitButton, { marginTop: 10 }]} 
        onPress={exitSession}
      >
        <Text style={styles.buttonText}>Exit Session</Text>
      </TouchableOpacity>
    </View>
  );

  // Main Render
  if (showSplash) {
    return renderSplashScreen();
  }

  return (
    <>
      <View style={styles.container}>
        {/* Top-right display of collected money */}
        <TouchableOpacity 
          style={styles.topRight}
          onPress={() => setShowMoneyModal(true)}
        >
          <Text style={styles.moneyText}>₹ {totalMoney}</Text>
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          {selectedDuration && taskName && (
            <Text style={styles.activeTaskName}>{taskName}</Text>
          )}
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

          {/* Input fields and timer start options */}
          {!selectedDuration && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Task Name"
                value={taskName}
                onChangeText={setTaskName}
              />
              <Text style={{ marginTop: 10 }}>Select Duration:</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.timerButton} 
                  onPress={() => startTimer(3600)}
                >
                  <Text style={styles.buttonText}>1 Hr</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.timerButton} 
                  onPress={() => startTimer(7200)}
                >
                  <Text style={styles.buttonText}>2 Hr</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.timerButton} 
                  onPress={() => startTimer(10800)}
                >
                  <Text style={styles.buttonText}>3 Hr</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ marginTop: 10 }}>Or set custom time (in minutes):</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 45"
                value={customMinutes}
                onChangeText={setCustomMinutes}
                keyboardType="numeric"
              />
              <TouchableOpacity 
                style={styles.customTimerButton} 
                onPress={startCustomTimer}
              >
                <Text style={styles.buttonText}>Start Custom Timer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Timer control buttons */}
          {selectedDuration && renderTimerControls()}
        </View>
      </View>

      {/* Move Modals and Confetti outside main container */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <ConfettiCannon
            count={150}
            origin={{x: Dimensions.get('window').width/2, y: -10}}
            autoStart={true}
            fadeOut={true}
            fallSpeed={3000}
            explosionSpeed={350}
            spread={70}
            colors={['#FFD700', '#4CAF50', '#2196F3', '#FF5722', '#E91E63']}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      )}

      {/* Celebration Modal */}
      <Modal visible={showCelebration} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.cancelIcon} onPress={closeCelebration}>
              <Text style={{ fontSize: 18 }}>X</Text>
            </TouchableOpacity>
            <Text style={styles.celebrationText}>Congratulations!</Text>
            <Text style={styles.celebrationText}>
              You earned ₹ {earned} for completing {(selectedDuration / 3600).toFixed(2)} hour session.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Money Modal */}
      <Modal
        visible={showMoneyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoneyModal(false)}
      >
        <TouchableOpacity 
          style={styles.moneyModalContainer}
          activeOpacity={1}
          onPress={() => setShowMoneyModal(false)}
        >
          <View style={styles.moneyModalContent}>
            <Text style={styles.moneyModalTitle}>Total Earnings</Text>
            <Text style={styles.moneyModalAmount}>₹ {totalMoney}</Text>
            <View style={styles.quoteDivider} />
            <Text style={styles.quoteText}>{getRandomQuote()}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32', // Dark green background
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#F5F5F5', // Light gray background
  },
  topRight: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#4CAF50', // Green background
    padding: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    transform: [{ scale: 1 }], // Add this for the press animation
  },
  moneyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timerText: {
    fontSize: 56,
    marginBottom: 30,
    marginTop: 10,
    color: '#2E7D32',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
    gap: 15,
  },
  controls: {
    marginTop: 30,
    width: '80%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 15,
  },
  celebrationText: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 15,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  timerButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    width: '28%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  customTimerButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  controlButton: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF5722',
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  exitButton: {
    backgroundColor: '#D32F2F', // Red color for exit button
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  moneyModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  moneyModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  moneyModalTitle: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  moneyModalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
  },
  quoteDivider: {
    height: 1,
    width: '80%',
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  quoteText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
  activeTaskName: {
    fontSize: 28,
    color: '#1565C0', // Rich blue color
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(21, 101, 192, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 10,
    borderRadius: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: 'none',
  }
});
