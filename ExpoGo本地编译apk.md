
### 🛠️ 第一步：安装 Android SDK
这里提供两种推荐的安装方式，选择你习惯的一种即可。

#### 方法一：通过 Android Studio 安装（推荐）

这种方式最省心，它会帮你管理 SDK、更新和平台工具。

1.  **下载 Android Studio**：去 [Android Studio 官网](https://developer.android.com/studio) 下载 Linux 版本（`.tar.gz` 文件）。
2.  **解压并安装**：将下载的文件解压到你的主目录（例如 `/home/你的用户名/android-studio`），进入 `bin` 文件夹，运行 `./studio.sh` 即可。
3.  **初次启动配置**：在 Android Studio 的 “SDK Components Setup” 界面，记录下 **Android SDK Location** 的路径（默认是 `/home/你的用户名/Android/Sdk`）。接着**进入下一步**，将所有默认组件安装完成。
4.  **安装所需 SDK Platform**：安装完成后，打开 Android Studio，进入 `Settings > Languages & Frameworks > Android SDK`。在 `SDK Platforms` 标签页，勾选 **Android 15 (VanillaIceCream)**，它对应 React Native / Expo 编译必需的 `Android SDK Platform 35`。
5.  **安装构建工具**：切换到 `SDK Tools` 标签页，勾选并安装 **Android SDK Build-Tools** 和 **Android SDK Command-line Tools (latest)**。最后点击 `Apply` 或 `OK` 开始下载。

#### 方法二：手动安装 Command Line Tools（仅命令行）

这种方法更精简，不依赖 IDE，适合在命令行环境使用。

1.  **下载命令行工具**：访问 [Android Studio 官网-commandlinetools-linux-xxxx_latest.zip](https://developer.android.com/studio?hl=zh-cn#command-line-tools-only) ，在 “仅限命令行工具” 部分下载 Linux 版本的 zip 包。


2.  **创建 SDK 目录**：在终端执行 `mkdir -p $HOME/Android/Sdk/cmdline-tools` 来创建目录。
3.  **解压工具**：使用 `unzip` 命令将下载的 zip 包解压，并移动到特定路径。
    ```bash
    # 假设下载的文件在 ~/Downloads
    cd ~/Downloads
    unzip commandlinetools-linux-*_latest.zip
    mv cmdline-tools $HOME/Android/Sdk/cmdline-tools/latest
    
    cd $HOME/Android/Sdk/cmdline-tools/latest
    ln -s latest/lib
    ```
    > **说明**：注意最后的 `lib` 目录移动是为了满足 `sdkmanager` 工具对目录结构的要求。

4.  **升级到 JDK 17**

    在终端中执行以下命令来安装 OpenJDK 17：

    ```bash
    sudo apt update
    sudo apt install openjdk-17-jdk
    ```

    系统在安装完 JDK 17 后，默认的 `java` 可能还是指向旧的 JDK 11。可以使用 `update-alternatives` 命令来一键切换到 JDK 17。

    ```bash
    sudo update-alternatives --config java
    ```

    执行后，系统会列出已安装的所有 Java 版本，并提示你输入数字进行选择。选择对应 JDK 17 的编号即可。

    切换成功后，运行以下命令来验证当前默认的 Java 版本：

    ```bash
    java -version
    ```

    如果输出信息中包含 `openjdk version "17..."`，就说明切换成功了。

    **JAVA_HOME** 环境变量也要更新

    升级完 JDK 后，你之前设置的环境变量 `JAVA_HOME` 还需要指向新的 JDK 17 路径。你需要用以下命令，**先找到 JDK 17 的正确安装路径**：

    ```bash
    # 找到 JDK 17 的安装目录
    dirname $(dirname $(readlink -f $(which java)))
    ```

    这个命令会输出 JDK 17 的实际路径，例如 `/usr/lib/jvm/java-17-openjdk-amd64`。

    找到后，编辑你的 `~/.bashrc` 文件，更新 `JAVA_HOME` 的值为上一步得到的路径，例如：

    ```bash
    # Java 环境 (使用 which java 命令获取你的实际路径)
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    export PATH="$JAVA_HOME/bin:$PATH"
    ```

### 🔧 第二步：配置环境变量
为了让系统在任何地方都能找到 Android SDK 的命令（如 `adb`、`sdkmanager`），需要把它们添加到环境变量中。

1.  **编辑 `~/.bashrc` 文件**：在终端执行 `vim ~/.bashrc`（也可以用你熟悉的编辑器）。
2.  **在文件末尾添加以下内容**：
    ```bash
    # Android SDK 环境 (通常为 $HOME/Android/Sdk)
    export ANDROID_HOME="$HOME/Android/Sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export PATH=$PATH:$ANDROID_HOME/emulator
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
    ```
    > **注意**：**保存后关闭**文件。
3.  **使配置生效**：执行 `source ~/.bashrc` 命令。
4.  **验证安装**：运行 `adb --version`，如果能看到版本信息，就说明安装成功了。

### 📦 第三步：安装所需的 SDK 组件（仅针对手动安装方式）
如果选择了手动安装，还需要用 `sdkmanager` 来安装 `platform-tools`、`build-tools` 以及你需要的特定 API 平台。

1.  **查看可用组件**：运行 `sdkmanager --list` 来查看所有可用的包。
2.  **安装核心组件**：执行以下命令来安装基本工具。
    ```bash
    # 安装平台工具 (包含 adb 和 fastboot)
    sdkmanager "platform-tools"
    
    # 安装构建工具版本 36.x.x (你可以通过 --list 查看更确切的版本号)
    sdkmanager "build-tools;36.0.0"
    
    # 安装 Android 15 (API 35) 的平台，这是 EAS Local Build 需要的一个版本
    sdkmanager "platforms;android-35"
    ```
    
    > **关于 SDK 版本 `54.0.0`**：
    > 你提到的版本很可能是 `build-tools` 的一个版本号。请注意，这个版本号与 Android 系统的 API 级别不同，后者数字要小得多（例如 API 35 对应 Android 15）。你可以使用 `sdkmanager --list | grep build-tools` 来查看所有可用的版本号。
    > 此外，`sdkmanager` 工具本身就位于 `cmdline-tools` 包中，不需要单独安装 `cmdline-tools` 这个版本。

### ✅ 第四步：验证并构建
1.  **最终验证**：运行 `echo $ANDROID_SDK_ROOT`，确保输出的路径正确。
2.  **构建命令**：
    ```bash
    eas build -p android --profile preview --local
    ```
