<script setup lang="ts">
import { useNotificationStore } from '../../stores/notificationStore';
import { storeToRefs } from 'pinia';

const store = useNotificationStore();
const { notifications } = storeToRefs(store);

const remove = (id: string) => {
  store.removeNotification(id);
};
</script>

<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="toast"
        :class="notification.type"
        @click="remove(notification.id)"
      >
        <span class="message">{{ notification.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
  pointer-events: none; /* Allow clicks to pass through container */
}

.toast {
  pointer-events: auto; /* Re-enable clicks on toasts */
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  background-color: #333;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  cursor: pointer;
  
  display: flex;
  align-items: center;
  
  transition: all 0.3s ease;
}

.toast.success {
  background-color: #4caf50;
}

.toast.error {
  background-color: #f44336;
}

.toast.info {
  background-color: #2196f3;
}

.toast.warning {
  background-color: #ff9800;
}

/* Transitions */
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.toast-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
