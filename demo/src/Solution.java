class Solution {
    public int maxFreeTime(int eventTime, int k, int[] startTime, int[] endTime) {
        int[] times = new int[endTime.length + 1];
        times[0] = startTime[0];
        for(int i = 1; i < endTime.length; i++){
            times[i] = startTime[i] - endTime[i - 1];
        }
        times[endTime.length] = eventTime - endTime[endTime.length - 1];

        int start = 0;
        int bet = 0;
        int max = 0;
        for (int i = 0; i < times.length; i++) {
            if(i - start < k){
                bet+=times[i];
                continue;
            }
            bet+=times[i];
            max = Math.max(bet, max);
            bet -= times[start];
            start++;
        }

        return max;
    }

    public static void main(String[] args) {
        Solution s = new Solution();
        s.maxFreeTime(5, 1, new int[]{1, 3}, new int[]{2, 5});
    }
}