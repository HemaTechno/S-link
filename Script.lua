local CoreGui = game:GetService("CoreGui")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local requestFunc = (syn and syn.request) or (http and http.request) or http_request or (fluxus and fluxus.request) or request

-- ==========================================
-- 1. استخراج البصمة (HWID)
-- ==========================================
local playerHWID = ""
local successHWID = pcall(function()
    playerHWID = game:GetService("RbxAnalyticsService"):GetClientId()
end)
if not successHWID or playerHWID == "" then
    playerHWID = tostring(Players.LocalPlayer.UserId) 
end

-- ==========================================
-- 2. إعدادات الروابط والملفات
-- ==========================================
local GET_KEY_LINK = "https://www.subx.click/api/keysystem?hwid=" .. playerHWID
local VERIFY_API_URL = "https://www.subx.click/api/verify-key" 
local GET_SCRIPTS_URL = "https://www.subx.click/api/scripts"
local DISCORD_INVITE = "https://discord.gg/hematech-1135848445471629393"
local KEY_FILE_NAME = "SubX_SavedKey.txt"

-- ==========================================
-- 3. رابط الصورة للزر العائم
-- ==========================================
local FLOATING_ICON_IMAGE = "rbxassetid://1234567890"

-- دالة التحقق من السيرفر
local function checkKeyWithServer(keyToVerify)
    if requestFunc then
        local success, response = pcall(function()
            return requestFunc({
                Url = VERIFY_API_URL,
                Method = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body = HttpService:JSONEncode({ key = keyToVerify, hwid = playerHWID })
            })
        end)
        
        if success and response and response.Body then
            return HttpService:JSONDecode(response.Body)
        end
    else
        local success, response = pcall(function()
            return HttpService:PostAsync(VERIFY_API_URL, HttpService:JSONEncode({
                key = keyToVerify,
                hwid = playerHWID
            }), Enum.HttpContentType.ApplicationJson)
        end)

        if success then
            return HttpService:JSONDecode(response)
        end
    end
    
    return {success = false, message = "Connection error!"}
end

-- ==========================================
-- دالة إنشاء تأثيرات أنيميشن
-- ==========================================
local function createGlowEffect(parent, color)
    local glow = Instance.new("Frame", parent)
    glow.BackgroundColor3 = color or Color3.fromRGB(100, 150, 255)
    glow.BackgroundTransparency = 0.8
    glow.BorderSizePixel = 0
    glow.Size = UDim2.new(1.1, 0, 1.1, 0)
    glow.Position = UDim2.new(-0.05, 0, -0.05, 0)
    Instance.new("UICorner", glow).CornerRadius = UDim.new(0, 10)
    return glow
end

-- ==========================================
-- دالة تشغيل واجهة الـ Hub الأساسية (مستطيلة وصغيرة)
-- ==========================================
local function loadScriptHub()
    local SubXHub = Instance.new("ScreenGui")
    SubXHub.Name = "SubXPremiumHub"
    SubXHub.Parent = CoreGui
    SubXHub.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

    -- ==========================================
    -- الأيقونة العائمة (صغيرة)
    -- ==========================================
    local FloatingIcon = Instance.new("ImageButton", SubXHub)
    FloatingIcon.Name = "FloatingIcon"
    FloatingIcon.BackgroundColor3 = Color3.fromRGB(10, 12, 25)
    FloatingIcon.BackgroundTransparency = 0.05
    FloatingIcon.Position = UDim2.new(0.02, 0, 0.85, 0)
    FloatingIcon.Size = UDim2.new(0, 40, 0, 40)
    FloatingIcon.Image = FLOATING_ICON_IMAGE
    FloatingIcon.Visible = false
    FloatingIcon.ScaleType = Enum.ScaleType.Fit
    
    local IconGlass = Instance.new("Frame", FloatingIcon)
    IconGlass.BackgroundColor3 = Color3.fromRGB(20, 25, 45)
    IconGlass.BackgroundTransparency = 0.7
    IconGlass.Size = UDim2.new(1, 0, 1, 0)
    Instance.new("UICorner", IconGlass).CornerRadius = UDim.new(1, 0)
    
    local IconGlow = Instance.new("Frame", FloatingIcon)
    IconGlow.BackgroundColor3 = Color3.fromRGB(100, 150, 255)
    IconGlow.BackgroundTransparency = 0.85
    IconGlow.Size = UDim2.new(1.5, 0, 1.5, 0)
    IconGlow.Position = UDim2.new(-0.25, 0, -0.25, 0)
    Instance.new("UICorner", IconGlow).CornerRadius = UDim.new(1, 0)
    
    local FloatStroke = Instance.new("UIStroke", FloatingIcon)
    FloatStroke.Color = Color3.fromRGB(100, 150, 255)
    FloatStroke.Thickness = 1.5
    FloatStroke.Transparency = 0.3
    Instance.new("UICorner", FloatingIcon).CornerRadius = UDim.new(1, 0)

    -- تحريك الأيقونة
    local iconDragging = false
    local iconDragStart = nil
    local iconStartPos = nil
    
    FloatingIcon.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            iconDragging = true
            iconDragStart = input.Position
            iconStartPos = FloatingIcon.Position
        end
    end)
    
    FloatingIcon.InputEnded:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            iconDragging = false
        end
    end)
    
    UserInputService.InputChanged:Connect(function(input)
        if iconDragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
            local delta = input.Position - iconDragStart
            FloatingIcon.Position = UDim2.new(
                iconStartPos.X.Scale, 
                iconStartPos.X.Offset + delta.X, 
                iconStartPos.Y.Scale, 
                iconStartPos.Y.Offset + delta.Y
            )
        end
    end)

    -- ==========================================
    -- الواجهة الرئيسية (مستطيلة وصغيرة جداً)
    -- ==========================================
    local MainFrame = Instance.new("Frame", SubXHub)
    MainFrame.Name = "MainFrame"
    MainFrame.BackgroundColor3 = Color3.fromRGB(8, 10, 22)
    MainFrame.BackgroundTransparency = 0.05
    MainFrame.Position = UDim2.new(0.5, -200, 0.5, -120)
    MainFrame.Size = UDim2.new(0, 400, 0, 240) -- أصغر حجم
    MainFrame.ClipsDescendants = false

    -- خلفية زجاجية
    local GlassBg = Instance.new("Frame", MainFrame)
    GlassBg.BackgroundColor3 = Color3.fromRGB(20, 25, 45)
    GlassBg.BackgroundTransparency = 0.85
    GlassBg.Size = UDim2.new(1, 0, 1, 0)
    Instance.new("UICorner", GlassBg).CornerRadius = UDim.new(0, 12)

    -- توهج خارجي
    local OuterGlow = createGlowEffect(MainFrame, Color3.fromRGB(100, 150, 255))
    OuterGlow.BackgroundTransparency = 0.88
    
    Instance.new("UICorner", MainFrame).CornerRadius = UDim.new(0, 12)
    local MainStroke = Instance.new("UIStroke", MainFrame)
    MainStroke.Color = Color3.fromRGB(100, 150, 255)
    MainStroke.Transparency = 0.3
    MainStroke.Thickness = 1

    -- ==========================================
    -- الشريط العلوي (صغير)
    -- ==========================================
    local TopBar = Instance.new("Frame", MainFrame)
    TopBar.BackgroundColor3 = Color3.fromRGB(15, 18, 35)
    TopBar.BackgroundTransparency = 0.3
    TopBar.Size = UDim2.new(1, 0, 0, 30)
    TopBar.BorderSizePixel = 0
    Instance.new("UICorner", TopBar).CornerRadius = UDim.new(0, 10)

    local IconLabel = Instance.new("TextLabel", TopBar)
    IconLabel.BackgroundTransparency = 1
    IconLabel.Position = UDim2.new(0, 6, 0, 0)
    IconLabel.Size = UDim2.new(0, 20, 0, 30)
    IconLabel.Font = Enum.Font.GothamBold
    IconLabel.Text = "↗️ "
    IconLabel.TextColor3 = Color3.fromRGB(100, 150, 255)
    IconLabel.TextSize = 14

    local Title = Instance.new("TextLabel", TopBar)
    Title.BackgroundTransparency = 1
    Title.Position = UDim2.new(0, 30, 0, 0)
    Title.Size = UDim2.new(0.15, 0, 1, 0)
    Title.Font = Enum.Font.GothamBold
    Title.Text = "SUBX"
    Title.TextColor3 = Color3.fromRGB(255, 255, 255)
    Title.TextSize = 12
    Title.TextXAlignment = Enum.TextXAlignment.Left

    -- زر الديسكورد (صغير)
    local DiscordBtn = Instance.new("TextButton", TopBar)
    DiscordBtn.BackgroundColor3 = Color3.fromRGB(88, 101, 242)
    DiscordBtn.BackgroundTransparency = 0.15
    DiscordBtn.Position = UDim2.new(1, -160, 0.5, -10)
    DiscordBtn.Size = UDim2.new(0, 100, 0, 20)
    DiscordBtn.Font = Enum.Font.GothamBold
    DiscordBtn.Text = "💬 Discord"
    DiscordBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    DiscordBtn.TextSize = 9
    Instance.new("UICorner", DiscordBtn).CornerRadius = UDim.new(0, 4)

    DiscordBtn.MouseButton1Click:Connect(function()
        if setclipboard then
            setclipboard(DISCORD_INVITE)
            DiscordBtn.Text = "✅ Copied!"
            task.wait(1.5)
            DiscordBtn.Text = "💬 Discord"
        end
    end)

    -- أزرار التحكم (صغيرة)
    local ControlButtons = Instance.new("Frame", TopBar)
    ControlButtons.BackgroundTransparency = 1
    ControlButtons.Position = UDim2.new(1, -60, 0, 0)
    ControlButtons.Size = UDim2.new(0, 55, 1, 0)

    local UIListLayout = Instance.new("UIListLayout", ControlButtons)
    UIListLayout.FillDirection = Enum.FillDirection.Horizontal
    UIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
    UIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center
    UIListLayout.Padding = UDim.new(0, 2)

    local function createControlButton(text)
        local btn = Instance.new("TextButton", ControlButtons)
        btn.BackgroundColor3 = Color3.fromRGB(25, 30, 50)
        btn.BackgroundTransparency = 0.5
        btn.Size = UDim2.new(0, 18, 0, 18)
        btn.Font = Enum.Font.GothamBold
        btn.Text = text
        btn.TextColor3 = Color3.fromRGB(200, 200, 220)
        btn.TextSize = 9
        Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 4)
        return btn
    end

    local HideBtn = createControlButton("◐")
    local MinBtn = createControlButton("—")
    local CloseBtn = createControlButton("✕")

    -- ==========================================
    -- المحتوى (صغير)
    -- ==========================================
    local ContentContainer = Instance.new("Frame", MainFrame)
    ContentContainer.BackgroundTransparency = 1
    ContentContainer.Position = UDim2.new(0, 6, 0, 36)
    ContentContainer.Size = UDim2.new(1, -12, 1, -44)

    -- تحميل
    local LoadingFrame = Instance.new("Frame", ContentContainer)
    LoadingFrame.BackgroundTransparency = 1
    LoadingFrame.Size = UDim2.new(1, 0, 1, 0)
    LoadingFrame.ZIndex = 5

    local LoadSpinner = Instance.new("TextLabel", LoadingFrame)
    LoadSpinner.BackgroundTransparency = 1
    LoadSpinner.Position = UDim2.new(0.5, -50, 0.4, -12)
    LoadSpinner.Size = UDim2.new(0, 100, 0, 25)
    LoadSpinner.Font = Enum.Font.GothamBold
    LoadSpinner.Text = "⟳ Loading..."
    LoadSpinner.TextColor3 = Color3.fromRGB(100, 150, 255)
    LoadSpinner.TextSize = 12

    task.spawn(function()
        local dots = ""
        local angle = 0
        while LoadingFrame.Parent do
            dots = dots == "..." and "." or dots .. "."
            angle = angle + 15
            LoadSpinner.Text = "🔃" .. dots
            LoadSpinner.Rotation = angle
            task.wait(0.15)
        end
    end)

    -- ==========================================
    -- قائمة الألعاب (مستطيلة وصغيرة)
    -- ==========================================
    local GamesContainer = Instance.new("Frame", ContentContainer)
    GamesContainer.BackgroundColor3 = Color3.fromRGB(15, 18, 35)
    GamesContainer.BackgroundTransparency = 0.3
    GamesContainer.Position = UDim2.new(0, 0, 0, 0)
    GamesContainer.Size = UDim2.new(0.32, 0, 1, 0)
    Instance.new("UICorner", GamesContainer).CornerRadius = UDim.new(0, 6)

    local GamesHeader = Instance.new("Frame", GamesContainer)
    GamesHeader.BackgroundColor3 = Color3.fromRGB(20, 25, 45)
    GamesHeader.BackgroundTransparency = 0.2
    GamesHeader.Size = UDim2.new(1, 0, 0, 24)
    Instance.new("UICorner", GamesHeader).CornerRadius = UDim.new(0, 5)

    local GamesTitle = Instance.new("TextLabel", GamesHeader)
    GamesTitle.BackgroundTransparency = 1
    GamesTitle.Position = UDim2.new(0, 6, 0, 0)
    GamesTitle.Size = UDim2.new(0.8, 0, 1, 0)
    GamesTitle.Font = Enum.Font.GothamBold
    GamesTitle.Text = "🎮 Maps"
    GamesTitle.TextColor3 = Color3.fromRGB(150, 180, 255)
    GamesTitle.TextSize = 9
    GamesTitle.TextXAlignment = Enum.TextXAlignment.Left

    local ScrollGames = Instance.new("ScrollingFrame", GamesContainer)
    ScrollGames.Active = true
    ScrollGames.BackgroundTransparency = 1
    ScrollGames.BorderSizePixel = 0
    ScrollGames.Position = UDim2.new(0.02, 0, 0.1, 0)
    ScrollGames.Size = UDim2.new(0.96, 0, 0.88, 0)
    ScrollGames.ScrollBarThickness = 2
    ScrollGames.ScrollBarImageColor3 = Color3.fromRGB(100, 150, 255)
    
    local UIListGames = Instance.new("UIListLayout", ScrollGames)
    UIListGames.Padding = UDim.new(0, 3)
    UIListGames.HorizontalAlignment = Enum.HorizontalAlignment.Center

    -- ==========================================
    -- قائمة السكربتات (مستطيلة وصغيرة)
    -- ==========================================
    local ScriptsContainer = Instance.new("Frame", ContentContainer)
    ScriptsContainer.BackgroundColor3 = Color3.fromRGB(15, 18, 35)
    ScriptsContainer.BackgroundTransparency = 0.3
    ScriptsContainer.Position = UDim2.new(0.34, 0, 0, 0)
    ScriptsContainer.Size = UDim2.new(0.64, 0, 1, 0)
    Instance.new("UICorner", ScriptsContainer).CornerRadius = UDim.new(0, 6)

    local ScriptsHeader = Instance.new("Frame", ScriptsContainer)
    ScriptsHeader.BackgroundColor3 = Color3.fromRGB(20, 25, 45)
    ScriptsHeader.BackgroundTransparency = 0.2
    ScriptsHeader.Size = UDim2.new(1, 0, 0, 24)
    Instance.new("UICorner", ScriptsHeader).CornerRadius = UDim.new(0, 5)

    local ScriptsTitle = Instance.new("TextLabel", ScriptsHeader)
    ScriptsTitle.BackgroundTransparency = 1
    ScriptsTitle.Position = UDim2.new(0, 6, 0, 0)
    ScriptsTitle.Size = UDim2.new(0.8, 0, 1, 0)
    ScriptsTitle.Font = Enum.Font.GothamBold
    ScriptsTitle.Text = "📜 SCRIPTS"
    ScriptsTitle.TextColor3 = Color3.fromRGB(150, 180, 255)
    ScriptsTitle.TextSize = 9
    ScriptsTitle.TextXAlignment = Enum.TextXAlignment.Left

    local ScrollScripts = Instance.new("ScrollingFrame", ScriptsContainer)
    ScrollScripts.Active = true
    ScrollScripts.BackgroundTransparency = 1
    ScrollScripts.BorderSizePixel = 0
    ScrollScripts.Position = UDim2.new(0.02, 0, 0.1, 0)
    ScrollScripts.Size = UDim2.new(0.96, 0, 0.88, 0)
    ScrollScripts.ScrollBarThickness = 2
    ScrollScripts.ScrollBarImageColor3 = Color3.fromRGB(100, 150, 255)
    
    local UIListScripts = Instance.new("UIListLayout", ScrollScripts)
    UIListScripts.Padding = UDim.new(0, 3)
    UIListScripts.HorizontalAlignment = Enum.HorizontalAlignment.Center

    local WelcomeMsg = Instance.new("TextLabel", ScrollScripts)
    WelcomeMsg.Size = UDim2.new(1, 0, 1, 0)
    WelcomeMsg.BackgroundTransparency = 1
    WelcomeMsg.Font = Enum.Font.Gotham
    WelcomeMsg.Text = "👈 Select game"
    WelcomeMsg.TextColor3 = Color3.fromRGB(100, 120, 180)
    WelcomeMsg.TextSize = 10

    -- ==========================================
    -- نظام التحريك السلس
    -- ==========================================
    local dragging = false
    local dragStart = nil
    local startPos = nil
    
    TopBar.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = MainFrame.Position
        end
    end)
    
    TopBar.InputEnded:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = false
        end
    end)
    
    UserInputService.InputChanged:Connect(function(input)
        if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
            local delta = input.Position - dragStart
            MainFrame.Position = UDim2.new(
                startPos.X.Scale, 
                startPos.X.Offset + delta.X, 
                startPos.Y.Scale, 
                startPos.Y.Offset + delta.Y
            )
        end
    end)

    -- ==========================================
    -- أزرار التحكم
    -- ==========================================
    CloseBtn.MouseButton1Click:Connect(function()
        TweenService:Create(MainFrame, TweenInfo.new(0.2, Enum.EasingStyle.Quad), {
            Size = UDim2.new(0, 0, 0, 0)
        }):Play()
        task.wait(0.2)
        SubXHub:Destroy() 
    end)
    
    local minimized = false
    MinBtn.MouseButton1Click:Connect(function()
        minimized = not minimized
        ContentContainer.Visible = not minimized
        local targetSize = minimized and UDim2.new(0, 400, 0, 30) or UDim2.new(0, 400, 0, 240)
        TweenService:Create(MainFrame, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
            Size = targetSize
        }):Play()
    end)

    HideBtn.MouseButton1Click:Connect(function()
        TweenService:Create(MainFrame, TweenInfo.new(0.2, Enum.EasingStyle.Quad), {
            Size = UDim2.new(0, 0, 0, 0)
        }):Play()
        task.wait(0.2)
        MainFrame.Visible = false
        FloatingIcon.Visible = true
        FloatingIcon.Size = UDim2.new(0, 0, 0, 0)
        TweenService:Create(FloatingIcon, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
            Size = UDim2.new(0, 40, 0, 40)
        }):Play()
    end)
    
    FloatingIcon.MouseButton1Click:Connect(function()
        TweenService:Create(FloatingIcon, TweenInfo.new(0.2, Enum.EasingStyle.Quad), {
            Size = UDim2.new(0, 0, 0, 0)
        }):Play()
        task.wait(0.2)
        FloatingIcon.Visible = false
        MainFrame.Visible = true
        MainFrame.Size = UDim2.new(0, 0, 0, 0)
        TweenService:Create(MainFrame, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
            Size = UDim2.new(0, 400, 0, 240)
        }):Play()
    end)

    -- ==========================================
    -- إشعار
    -- ==========================================
    local function ShowSubXNotification()
        local NotifGui = Instance.new("ScreenGui", CoreGui)
        local NotifFrame = Instance.new("Frame", NotifGui)
        NotifFrame.AnchorPoint = Vector2.new(0.5, 0.5)
        NotifFrame.BackgroundColor3 = Color3.fromRGB(10, 12, 25)
        NotifFrame.BackgroundTransparency = 0.1
        NotifFrame.Position = UDim2.new(0.5, 0, 0.12, 0)
        NotifFrame.Size = UDim2.new(0, 150, 0, 40)
        Instance.new("UICorner", NotifFrame).CornerRadius = UDim.new(0, 8)
        
        local NotifGlow = createGlowEffect(NotifFrame, Color3.fromRGB(100, 150, 255))
        NotifGlow.BackgroundTransparency = 0.9
        
        local NotifLabel = Instance.new("TextLabel", NotifFrame)
        NotifLabel.BackgroundTransparency = 1
        NotifLabel.Size = UDim2.new(1, 0, 1, 0)
        NotifLabel.Font = Enum.Font.GothamBold
        NotifLabel.Text = "⚡ SUBX"
        NotifLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
        NotifLabel.TextSize = 14
        
        task.spawn(function()
            task.wait(2)
            NotifGui:Destroy()
        end)
    end

    -- ==========================================
    -- تحميل البيانات
    -- ==========================================
    task.spawn(function()
        local response = requestFunc({Url = GET_SCRIPTS_URL, Method = "GET"})
        LoadingFrame:Destroy()
        
        if response and response.Body then
            local data = HttpService:JSONDecode(response.Body)
            if data.success and data.games then
                for _, gameData in pairs(data.games) do
                    local mapBtn = Instance.new("TextButton", ScrollGames)
                    mapBtn.BackgroundColor3 = Color3.fromRGB(25, 30, 55)
                    mapBtn.BackgroundTransparency = 0.2
                    mapBtn.Size = UDim2.new(0.94, 0, 0, 28)
                    mapBtn.Font = Enum.Font.GothamBold
                    mapBtn.Text = "▸ " .. gameData.gameName
                    mapBtn.TextColor3 = Color3.fromRGB(200, 210, 230)
                    mapBtn.TextSize = 9
                    mapBtn.TextXAlignment = Enum.TextXAlignment.Left
                    Instance.new("UICorner", mapBtn).CornerRadius = UDim.new(0, 4)

                    mapBtn.MouseButton1Click:Connect(function()
                        for _, child in pairs(ScrollScripts:GetChildren()) do 
                            if child ~= WelcomeMsg then
                                child:Destroy() 
                            end
                        end
                        WelcomeMsg.Visible = false

                        for _, scriptData in pairs(gameData.scripts) do
                            local scriptBtn = Instance.new("TextButton", ScrollScripts)
                            scriptBtn.BackgroundColor3 = Color3.fromRGB(25, 30, 55)
                            scriptBtn.BackgroundTransparency = 0.2
                            scriptBtn.Size = UDim2.new(0.96, 0, 0, 30)
                            scriptBtn.Font = Enum.Font.GothamBold
                            scriptBtn.Text = "↗️ " .. scriptData.name
                            scriptBtn.TextColor3 = Color3.fromRGB(220, 225, 240)
                            scriptBtn.TextSize = 9
                            scriptBtn.TextXAlignment = Enum.TextXAlignment.Left
                            Instance.new("UICorner", scriptBtn).CornerRadius = UDim.new(0, 4)

                            scriptBtn.MouseButton1Click:Connect(function()
                                scriptBtn.Text = "⏳ Exec..."
                                scriptBtn.TextColor3 = Color3.fromRGB(255, 200, 50)
                                SubXHub.Enabled = false
                                ShowSubXNotification()

                                local success = pcall(function()
                                    local scriptContent = requestFunc and requestFunc({Url = scriptData.url, Method = "GET"}).Body or game:HttpGet(scriptData.url)
                                    loadstring(scriptContent)()
                                end)
                                
                                if success then
                                    task.wait(1.5)
                                    SubXHub:Destroy()
                                else
                                    SubXHub.Enabled = true
                                    scriptBtn.Text = "✕ Failed"
                                    scriptBtn.TextColor3 = Color3.fromRGB(255, 80, 80)
                                    task.wait(1.5)
                                    scriptBtn.Text = "↗️ " .. scriptData.name
                                    scriptBtn.TextColor3 = Color3.fromRGB(220, 225, 240)
                                end
                            end)
                        end
                    end)
                end
            end
        end
    end)
end

-- ==========================================
-- واجهة المفتاح (مستطيلة وصغيرة)
-- ==========================================
local savedKey = ""
pcall(function()
    if isfile and isfile(KEY_FILE_NAME) then
        savedKey = readfile(KEY_FILE_NAME)
    end
end)

if savedKey ~= "" then
    local verifyResult = checkKeyWithServer(savedKey)
    if verifyResult.success then
        loadScriptHub()
        return
    else
        pcall(function() delfile(KEY_FILE_NAME) end)
    end
end

local KeySystemUI = Instance.new("ScreenGui", CoreGui)
KeySystemUI.Name = "KeySystemUI"

local MainFrame = Instance.new("Frame", KeySystemUI)
MainFrame.BackgroundColor3 = Color3.fromRGB(8, 10, 22)
MainFrame.BackgroundTransparency = 0.05
MainFrame.Position = UDim2.new(0.5, -130, 0.5, -85)
MainFrame.Size = UDim2.new(0, 260, 0, 170)
MainFrame.ClipsDescendants = false

local GlassFrame = Instance.new("Frame", MainFrame)
GlassFrame.BackgroundColor3 = Color3.fromRGB(20, 25, 45)
GlassFrame.BackgroundTransparency = 0.85
GlassFrame.Size = UDim2.new(1, 0, 1, 0)
Instance.new("UICorner", GlassFrame).CornerRadius = UDim.new(0, 12)

local KeyGlow = Instance.new("Frame", MainFrame)
KeyGlow.BackgroundColor3 = Color3.fromRGB(100, 150, 255)
KeyGlow.BackgroundTransparency = 0.88
KeyGlow.Size = UDim2.new(1.1, 0, 1.1, 0)
KeyGlow.Position = UDim2.new(-0.05, 0, -0.05, 0)
Instance.new("UICorner", KeyGlow).CornerRadius = UDim.new(0, 14)

Instance.new("UICorner", MainFrame).CornerRadius = UDim.new(0, 12)
local MainStroke = Instance.new("UIStroke", MainFrame)
MainStroke.Color = Color3.fromRGB(100, 150, 255)
MainStroke.Transparency = 0.3
MainStroke.Thickness = 1

local LockIcon = Instance.new("TextLabel", MainFrame)
LockIcon.BackgroundTransparency = 1
LockIcon.Position = UDim2.new(0.5, -12, 0.05, 0)
LockIcon.Size = UDim2.new(0, 24, 0, 24)
LockIcon.Font = Enum.Font.GothamBold
LockIcon.Text = "🔒"
LockIcon.TextColor3 = Color3.fromRGB(100, 150, 255)
LockIcon.TextSize = 20

local Title = Instance.new("TextLabel", MainFrame)
Title.BackgroundTransparency = 1
Title.Position = UDim2.new(0, 0, 0.2, 0)
Title.Size = UDim2.new(1, 0, 0, 25)
Title.Font = Enum.Font.GothamBold
Title.Text = "SubX Premium"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.TextSize = 14

local SubTitle = Instance.new("TextLabel", MainFrame)
SubTitle.BackgroundTransparency = 1
SubTitle.Position = UDim2.new(0, 0, 0.33, 0)
SubTitle.Size = UDim2.new(1, 0, 0, 16)
SubTitle.Font = Enum.Font.Gotham
SubTitle.Text = "Enter license key"
SubTitle.TextColor3 = Color3.fromRGB(150, 170, 220)
SubTitle.TextSize = 9

local KeyInput = Instance.new("TextBox", MainFrame)
KeyInput.BackgroundColor3 = Color3.fromRGB(25, 30, 55)
KeyInput.BackgroundTransparency = 0.3
KeyInput.Position = UDim2.new(0.1, 0, 0.42, 0)
KeyInput.Size = UDim2.new(0.8, 0, 0, 30)
KeyInput.Font = Enum.Font.Gotham
KeyInput.PlaceholderText = "Enter key..."
KeyInput.PlaceholderColor3 = Color3.fromRGB(100, 120, 180)
KeyInput.Text = ""
KeyInput.TextColor3 = Color3.fromRGB(255, 255, 255)
KeyInput.TextSize = 12
Instance.new("UICorner", KeyInput).CornerRadius = UDim.new(0, 6)

local InputLine = Instance.new("Frame", MainFrame)
InputLine.BackgroundColor3 = Color3.fromRGB(100, 150, 255)
InputLine.BackgroundTransparency = 0.5
InputLine.Position = UDim2.new(0.1, 0, 0.58, 0)
InputLine.Size = UDim2.new(0.8, 0, 0, 1.5)

local ButtonsFrame = Instance.new("Frame", MainFrame)
ButtonsFrame.BackgroundTransparency = 1
ButtonsFrame.Position = UDim2.new(0.1, 0, 0.65, 0)
ButtonsFrame.Size = UDim2.new(0.8, 0, 0, 30)

local VerifyBtn = Instance.new("TextButton", ButtonsFrame)
VerifyBtn.BackgroundColor3 = Color3.fromRGB(100, 150, 255)
VerifyBtn.Position = UDim2.new(0, 0, 0, 0)
VerifyBtn.Size = UDim2.new(0.47, 0, 1, 0)
VerifyBtn.Font = Enum.Font.GothamBold
VerifyBtn.Text = "VERIFY"
VerifyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
VerifyBtn.TextSize = 10
Instance.new("UICorner", VerifyBtn).CornerRadius = UDim.new(0, 6)

local GetKeyBtn = Instance.new("TextButton", ButtonsFrame)
GetKeyBtn.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
GetKeyBtn.BackgroundTransparency = 0.1
GetKeyBtn.Position = UDim2.new(0.53, 0, 0, 0)
GetKeyBtn.Size = UDim2.new(0.47, 0, 1, 0)
GetKeyBtn.Font = Enum.Font.GothamBold
GetKeyBtn.Text = "GET KEY"
GetKeyBtn.TextColor3 = Color3.fromRGB(200, 210, 230)
GetKeyBtn.TextSize = 10
Instance.new("UICorner", GetKeyBtn).CornerRadius = UDim.new(0, 6)
local GetStroke = Instance.new("UIStroke", GetKeyBtn)
GetStroke.Color = Color3.fromRGB(100, 150, 255)
GetStroke.Transparency = 0.3
GetStroke.Thickness = 1

local StatusText = Instance.new("TextLabel", MainFrame)
StatusText.BackgroundTransparency = 1
StatusText.Position = UDim2.new(0, 0, 0.88, 0)
StatusText.Size = UDim2.new(1, 0, 0, 16)
StatusText.Font = Enum.Font.Gotham
StatusText.Text = "⚡ Ready"
StatusText.TextColor3 = Color3.fromRGB(100, 150, 255)
StatusText.TextSize = 9

-- أنيميشن
task.spawn(function()
    local t = 0
    while KeySystemUI.Parent do
        t = t + 0.02
        local alpha = 0.3 + math.sin(t) * 0.2
        InputLine.BackgroundTransparency = alpha
        KeyGlow.BackgroundTransparency = 0.85 + math.sin(t * 0.5) * 0.05
        task.wait()
    end
end)

GetKeyBtn.MouseButton1Click:Connect(function()
    if setclipboard then
        setclipboard(GET_KEY_LINK)
        StatusText.Text = "✅ Copied!"
        StatusText.TextColor3 = Color3.fromRGB(100, 255, 150)
        task.wait(2)
        StatusText.Text = "⚡ Ready"
        StatusText.TextColor3 = Color3.fromRGB(100, 150, 255)
    end
end)

VerifyBtn.MouseButton1Click:Connect(function()
    local inputtedKey = KeyInput.Text
    if inputtedKey == "" then
        StatusText.Text = "⚠️ Enter key"
        StatusText.TextColor3 = Color3.fromRGB(255, 200, 50)
        return
    end
    
    StatusText.Text = "⏳ Checking..."
    StatusText.TextColor3 = Color3.fromRGB(255, 200, 50)
    local result = checkKeyWithServer(inputtedKey)

    if result.success then
        StatusText.Text = "✅ Verified!"
        StatusText.TextColor3 = Color3.fromRGB(100, 255, 150)
        pcall(function() writefile(KEY_FILE_NAME, inputtedKey) end)
        task.wait(0.8)
        KeySystemUI:Destroy()
        loadScriptHub()
    else
        StatusText.Text = result.message or "❌ Invalid"
        StatusText.TextColor3 = Color3.fromRGB(255, 80, 80)
        task.wait(2)
        StatusText.Text = "⚡ Ready"
        StatusText.TextColor3 = Color3.fromRGB(100, 150, 255)
    end
end)
