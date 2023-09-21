<template style="display: flex; padding: 0;">
    <div style="width: 1.5rem; margin : 5px 0 0px 0;" :style="show">
        <img src=" /loading.gif" alt="GIF">
    </div>
    <p class="textContainer" style="margin : 5px 0 5px 0;">{{ text }}</p>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
    name: 'loading',
    props: {
        text: {
            type: String,
            required: true
        }
    },
    setup(props, data) {
        const show = ref("display:none;")
        const text = ref(props.text)
        function loadingHandler() {
            if (props.text == "") {
                show.value = "display:inline-block;"
                text.value = ""
            } else {
                show.value = "display:none;"
                text.value = props.text
            }
        }
        watch(() => props.text, loadingHandler);
        return {
            show,
            text
        }
    },
});
</script>

