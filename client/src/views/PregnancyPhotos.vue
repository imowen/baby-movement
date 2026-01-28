<template>
  <div class="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
    <div class="max-w-6xl mx-auto">
      <!-- 标题 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">📸 孕期照片时间线</h1>
        <p class="text-gray-600">记录宝宝成长的每一周 💕</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p class="mt-4 text-gray-600">加载中...</p>
      </div>

      <!-- 时间线网格 -->
      <div v-else class="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-4">
        <div
          v-for="item in timeline"
          :key="item.week"
          @click="selectWeek(item.week)"
          class="aspect-square rounded-lg cursor-pointer transition-all hover:scale-105"
          :class="[
            item.hasPhotos
              ? 'bg-white shadow-md hover:shadow-lg'
              : 'bg-gray-100 hover:bg-gray-200',
            selectedWeek === item.week ? 'ring-4 ring-pink-500' : ''
          ]"
        >
          <div class="h-full flex flex-col items-center justify-center p-2">
            <div class="text-xs text-gray-500 mb-1">第{{item.week}}周</div>
            <div v-if="item.mainPhoto" class="w-full h-16 rounded overflow-hidden">
              <img
                :src="item.mainPhoto.url"
                :alt="`第${item.week}周`"
                class="w-full h-full object-cover"
              >
            </div>
            <div v-else class="text-2xl text-gray-300">📷</div>
            <div v-if="item.additionalCount > 0" class="text-xs text-pink-500 mt-1">
              +{{item.additionalCount}}
            </div>
          </div>
        </div>
      </div>

      <!-- 照片详情弹窗 -->
      <div
        v-if="selectedWeek"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <!-- 标题 -->
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-gray-800">第{{selectedWeek}}周</h2>
              <button
                @click="closeModal"
                class="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <!-- 主照片 -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-700 mb-2">主照片</h3>
              <div v-if="weekPhotos.mainPhoto" class="relative">
                <img
                  :src="weekPhotos.mainPhoto.url"
                  :alt="`第${selectedWeek}周主照片`"
                  class="w-full rounded-lg"
                >
                <button
                  @click="deletePhoto(weekPhotos.mainPhoto.id)"
                  class="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                >
                  删除
                </button>
              </div>
              <div v-else class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  ref="mainPhotoInput"
                  @change="handleFileSelect($event, 'main')"
                  accept="image/*"
                  class="hidden"
                >
                <button
                  @click="$refs.mainPhotoInput.click()"
                  class="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
                >
                  📷 上传主照片
                </button>
              </div>
            </div>

            <!-- 辅助照片 -->
            <div>
              <h3 class="text-lg font-semibold text-gray-700 mb-2">
                辅助照片 ({{weekPhotos.additionalPhotos.length}}/2)
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div
                  v-for="photo in weekPhotos.additionalPhotos"
                  :key="photo.id"
                  class="relative"
                >
                  <img
                    :src="photo.url"
                    :alt="`第${selectedWeek}周辅助照片`"
                    class="w-full rounded-lg"
                  >
                  <button
                    @click="deletePhoto(photo.id)"
                    class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-sm rounded hover:bg-red-600"
                  >
                    删除
                  </button>
                </div>

                <!-- 上传按钮 -->
                <div
                  v-if="weekPhotos.additionalPhotos.length < 2"
                  class="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                >
                  <input
                    type="file"
                    ref="additionalPhotoInput"
                    @change="handleFileSelect($event, 'additional')"
                    accept="image/*"
                    class="hidden"
                  >
                  <button
                    @click="$refs.additionalPhotoInput.click()"
                    class="text-gray-500 hover:text-pink-500"
                  >
                    <span class="text-4xl">+</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 上传进度 -->
            <div v-if="uploading" class="mt-4 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              <p class="mt-2 text-gray-600">上传中...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../api';

export default {
  name: 'PregnancyPhotos',
  setup() {
    const timeline = ref([]);
    const selectedWeek = ref(null);
    const weekPhotos = ref({ mainPhoto: null, additionalPhotos: [] });
    const loading = ref(true);
    const uploading = ref(false);

    // 加载时间线
    const loadTimeline = async () => {
      try {
        loading.value = true;
        const data = await api.getPhotosTimeline();
        timeline.value = data.timeline;
      } catch (error) {
        console.error('加载时间线失败:', error);
        alert('加载失败，请重试');
      } finally {
        loading.value = false;
      }
    };

    // 选择周
    const selectWeek = async (week) => {
      selectedWeek.value = week;
      try {
        const data = await api.getWeekPhotos(week);
        weekPhotos.value = data;
      } catch (error) {
        console.error('加载照片失败:', error);
        alert('加载照片失败');
      }
    };

    // 关闭弹窗
    const closeModal = () => {
      selectedWeek.value = null;
      weekPhotos.value = { mainPhoto: null, additionalPhotos: [] };
    };

    // 处理文件选择
    const handleFileSelect = async (event, type) => {
      const file = event.target.files[0];
      if (!file) return;

      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        alert('照片大小不能超过5MB');
        return;
      }

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('只能上传图片文件');
        return;
      }

      try {
        uploading.value = true;

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('week', selectedWeek.value);
        formData.append('type', type);

        await api.uploadPhoto(formData);

        // 重新加载照片
        await selectWeek(selectedWeek.value);
        await loadTimeline();

        alert('上传成功！');
      } catch (error) {
        console.error('上传失败:', error);
        alert(error.error || '上传失败，请重试');
      } finally {
        uploading.value = false;
        // 清空input
        event.target.value = '';
      }
    };

    // 删除照片
    const deletePhoto = async (photoId) => {
      if (!confirm('确定要删除这张照片吗？')) return;

      try {
        await api.deletePhoto(photoId);
        await selectWeek(selectedWeek.value);
        await loadTimeline();
        alert('删除成功！');
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    };

    onMounted(() => {
      loadTimeline();
    });

    return {
      timeline,
      selectedWeek,
      weekPhotos,
      loading,
      uploading,
      selectWeek,
      closeModal,
      handleFileSelect,
      deletePhoto
    };
  }
};
</script>
