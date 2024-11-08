<script lang="ts">
  import { user } from '$lib/stores/auth';
</script>

<h1>Protected Page</h1>
<p>If you can see this, you're authenticated!</p>
<pre>{JSON.stringify($user, null, 2)}</pre>
