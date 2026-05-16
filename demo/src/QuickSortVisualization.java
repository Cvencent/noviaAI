import javax.swing.*;
import java.awt.*;
import java.util.Arrays;

public class QuickSortVisualization extends JFrame {

    private int[] array;
    private int currentStep = 0;
    private int low = -1, high = -1, pivotIndex = -1;
    private int comparingIndex = -1;
    private int partitionIndex = -1;
    private boolean isSorting = false;
    private boolean isComplete = false;

    public QuickSortVisualization() {
        setTitle("快速排序可视化");
        setSize(800, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        // 初始化数组
        resetArray();

        JButton startButton = new JButton("开始排序");
        JButton resetButton = new JButton("重置数组");
        JButton stepButton = new JButton("单步执行");

        startButton.addActionListener(e -> {
            if (!isSorting) {
                isSorting = true;
                new Thread(this::quickSort).start();
            }
        });

        resetButton.addActionListener(e -> resetArray());

        stepButton.addActionListener(e -> {
            if (!isSorting && !isComplete) {
                isSorting = true;
                stepQuickSort();
                isSorting = false;
            }
        });

        JPanel controlPanel = new JPanel();
        controlPanel.add(startButton);
        controlPanel.add(stepButton);
        controlPanel.add(resetButton);

        add(controlPanel, BorderLayout.SOUTH);
    }

    private void resetArray() {
        array = new int[15];
        for (int i = 0; i < array.length; i++) {
            array[i] = (int)(Math.random() * 90) + 10;
        }
        currentStep = 0;
        low = -1;
        high = -1;
        pivotIndex = -1;
        comparingIndex = -1;
        partitionIndex = -1;
        isSorting = false;
        isComplete = false;
        repaint();
    }

    private void quickSort() {
        quickSort(array, 0, array.length - 1);
        isComplete = true;
        isSorting = false;
        repaint();
    }

    private void stepQuickSort() {
        if (low < 0 && high < 0) {
            quickSortStep(array, 0, array.length - 1);
        } else {
            quickSortStep(array, low, high);
        }
        repaint();
    }

    private void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pivotIdx = partition(arr, low, high);

            this.low = low;
            this.high = pivotIdx - 1;
            this.pivotIndex = pivotIdx;
            repaint();
            sleep(1000);

            quickSort(arr, low, pivotIdx - 1);

            this.low = pivotIdx + 1;
            this.high = high;
            this.pivotIndex = pivotIdx;
            repaint();
            sleep(1000);

            quickSort(arr, pivotIdx + 1, high);
        }
    }

    private void quickSortStep(int[] arr, int l, int h) {
        if (l < h) {
            if (partitionIndex < 0) {
                partitionIndex = partitionStep(arr, l, h);
            } else {
                if (l < partitionIndex - 1) {
                    low = l;
                    high = partitionIndex - 1;
                } else if (partitionIndex + 1 < h) {
                    low = partitionIndex + 1;
                    high = h;
                    partitionIndex = -1;
                } else {
                    low = -1;
                    high = -1;
                    partitionIndex = -1;
                    isComplete = l == 0 && h == array.length - 1;
                }
            }
        } else {
            low = -1;
            high = -1;
            partitionIndex = -1;
            isComplete = l == 0 && h == array.length - 1;
        }
    }

    private int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;

        for (int j = low; j < high; j++) {
            comparingIndex = j;
            repaint();
            sleep(300);

            if (arr[j] < pivot) {
                i++;
                swap(arr, i, j);
                repaint();
                sleep(300);
            }
        }

        swap(arr, i + 1, high);
        comparingIndex = -1;
        return i + 1;
    }

    private int partitionStep(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        pivotIndex = high;
        this.low = low;
        this.high = high;

        for (int j = low; j < high; j++) {
            comparingIndex = j;
            repaint();

            if (arr[j] < pivot) {
                i++;
                swap(arr, i, j);
                repaint();
            }
        }

        swap(arr, i + 1, high);
        comparingIndex = -1;
        return i + 1;
    }

    private void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    private void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void paint(Graphics g) {
        super.paint(g);
        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // 绘制数组
        int width = getWidth();
        int height = getHeight() - 100;
        int barWidth = width / (array.length + 2);
        int maxValue = Arrays.stream(array).max().getAsInt();

        for (int i = 0; i < array.length; i++) {
            int barHeight = (int) ((double) array[i] / maxValue * (height - 50));
            int x = (i + 1) * barWidth;
            int y = height - barHeight;

            // 设置不同状态的颜色
            if (isComplete) {
                g2d.setColor(new Color(46, 204, 113)); // 完成：绿色
            } else if (i == pivotIndex) {
                g2d.setColor(new Color(155, 89, 182)); // 基准元素：紫色
            } else if (i == comparingIndex) {
                g2d.setColor(new Color(231, 76, 60));  // 比较元素：红色
            } else if (low != -1 && i >= low && i <= high) {
                g2d.setColor(new Color(52, 152, 219)); // 当前分区：蓝色
            } else {
                g2d.setColor(new Color(149, 165, 166)); // 其他元素：灰色
            }

            g2d.fillRect(x, y, barWidth - 2, barHeight);
            g2d.setColor(Color.BLACK);
            g2d.drawRect(x, y, barWidth - 2, barHeight);

            // 绘制数值
            g2d.setColor(Color.BLACK);
            g2d.drawString(String.valueOf(array[i]), x + barWidth/2 - 10, y - 5);
        }

        // 绘制信息
        g2d.setColor(Color.BLACK);
        g2d.setFont(new Font("微软雅黑", Font.BOLD, 16));
        g2d.drawString("快速排序算法可视化演示", 20, 40);

        g2d.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        if (isComplete) {
            g2d.drawString("排序完成！", 20, 70);
        } else if (pivotIndex != -1) {
            g2d.drawString("当前基准值: " + array[pivotIndex], 20, 70);
        }

        // 绘制图例
        drawLegend(g2d, width - 200, height + 30);
    }

    private void drawLegend(Graphics2D g2d, int x, int y) {
        g2d.setFont(new Font("微软雅黑", Font.PLAIN, 12));

        g2d.setColor(new Color(149, 165, 166));
        g2d.fillRect(x, y, 15, 15);
        g2d.setColor(Color.BLACK);
        g2d.drawRect(x, y, 15, 15);
        g2d.drawString("未处理元素", x + 25, y + 12);

        g2d.setColor(new Color(52, 152, 219));
        g2d.fillRect(x, y + 25, 15, 15);
        g2d.setColor(Color.BLACK);
        g2d.drawRect(x, y + 25, 15, 15);
        g2d.drawString("当前分区", x + 25, y + 37);

        g2d.setColor(new Color(231, 76, 60));
        g2d.fillRect(x, y + 50, 15, 15);
        g2d.setColor(Color.BLACK);
        g2d.drawRect(x, y + 50, 15, 15);
        g2d.drawString("比较中元素", x + 25, y + 62);

        g2d.setColor(new Color(155, 89, 182));
        g2d.fillRect(x, y + 75, 15, 15);
        g2d.setColor(Color.BLACK);
        g2d.drawRect(x, y + 75, 15, 15);
        g2d.drawString("基准元素", x + 25, y + 87);

        g2d.setColor(new Color(46, 204, 113));
        g2d.fillRect(x, y + 100, 15, 15);
        g2d.setColor(Color.BLACK);
        g2d.drawRect(x, y + 100, 15, 15);
        g2d.drawString("已排序元素", x + 25, y + 112);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            QuickSortVisualization visualization = new QuickSortVisualization();
            visualization.setVisible(true);
        });
    }
}