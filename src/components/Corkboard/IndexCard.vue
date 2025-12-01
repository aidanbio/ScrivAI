<script setup lang="ts">
import type { ScrivNode } from '../../types';

defineProps<{
  node: ScrivNode;
}>();
</script>

<template>
  <div class="index-card">
    <div class="card-header">
      <span class="card-title">{{ node.title }}</span>
      <span class="card-status" :class="node.status.toLowerCase()">{{ node.status }}</span>
    </div>
    <div class="card-body">
      <div v-if="node.synopsisImage" class="card-image">
        <img :src="node.synopsisImage" alt="Synopsis Image" />
      </div>
      <p>{{ node.synopsis || 'No synopsis...' }}</p>
    </div>
  </div>
</template>

<style scoped>
.index-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
  height: 250px; /* Increased height to accommodate image */
  display: flex;
  flex-direction: column;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: grab;
}

.index-card:hover {
  transform: translateY(-2px);
  box-shadow: 3px 3px 8px rgba(0,0,0,0.15);
}

.index-card:active {
  cursor: grabbing;
}

.card-header {
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
  border-radius: 4px 4px 0 0;
  flex-shrink: 0;
}

.card-title {
  font-weight: bold;
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.card-status {
  font-size: 0.7em;
  padding: 2px 4px;
  border-radius: 3px;
  background: #eee;
}

.card-status.draft { background: #ffebee; color: #c62828; }
.card-status.revised { background: #e3f2fd; color: #1565c0; }
.card-status.final { background: #e8f5e9; color: #2e7d32; }

.card-body {
  padding: 10px;
  flex-grow: 1;
  overflow: hidden;
  font-size: 0.8em;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-image {
  width: 100%;
  height: 100px;
  overflow: hidden;
  border-radius: 2px;
  flex-shrink: 0;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body p {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
