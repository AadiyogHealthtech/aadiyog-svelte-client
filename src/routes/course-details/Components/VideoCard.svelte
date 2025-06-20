<script lang="ts">
  export let id: number;
  export let title: string;
  export let description: string;
  export let videoUrl: string;
  export let imageSrc: string;
</script>

<div class="bg-white rounded-lg shadow-md p-4 w-full">
  <img src={imageSrc} alt="Exercise Thumbnail" class="w-full h-40 object-cover rounded-md mb-2" />
  <h3 class="font-semibold text-lg truncate">{title}</h3>
  <p class="text-sm text-gray-600 truncate">{description}</p>
  <video src={videoUrl} controls class="mt-2 w-full rounded-md" />
</div>
